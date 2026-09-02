import chalk from 'chalk';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Impressão de relatórios de crash/stacktrace no terminal (modo --attach).
 *
 * Genérico por design: o diretório vem da configuração (stacktraceReportDir),
 * não há nomes de projeto nem caminhos hardcoded. O parser reconhece o formato
 * de bug report do EurekaLog (arquivos .el, UTF-16 LE), que é o padrão de
 * relatório de exceção mais comum em aplicações Delphi, MAS não depende do
 * idioma do relatório: usa a numeração estável dos campos (2.5 = tipo, 2.6 =
 * mensagem) e a tabela de pilha delimitada por pipe, com cabeçalho de colunas.
 *
 * Se o formato não for reconhecido, cai para um dump bruto (limitado) do
 * arquivo, de modo que o recurso continue útil para qualquer relatório textual.
 *
 * As funções de parsing/formatação são puras para permitir teste unitário.
 */

export interface StacktraceExceptionInfo {
  type?: string;
  message?: string;
  address?: string;
  date?: string;
}

export interface StacktraceFrame {
  module: string;
  unit: string;
  className: string;
  procedure: string;
  line: string;
  /** true quando o frame pertence ao código do próprio app (tem source .pas). */
  isAppFrame: boolean;
}

export interface StacktraceReport {
  exception: StacktraceExceptionInfo;
  stack: StacktraceFrame[];
  /** true se o parser reconheceu a estrutura esperada. */
  recognized: boolean;
}

/** Resolve os templates suportados no caminho do diretório de relatórios. */
export function resolveReportDirTemplate(template: string, envVersion: string): string {
  return template
    .replace(/\$\{userProfile\}/gi, os.homedir())
    .replace(/\$userProfile/gi, os.homedir())
    .replace(/\$\{envVersion\}/g, envVersion)
    .replace(/\$envVersion/g, envVersion);
}

/**
 * Localiza o relatório mais recente (por mtime) dentro de rootDir, recursivo,
 * cujo mtime seja posterior a `since`. Retorna null se não houver relatório
 * novo ou o diretório não existir. Por padrão considera arquivos .el, mas
 * aceita outras extensões via `extensions`.
 */
export function findLatestReport(
  rootDir: string,
  since: Date,
  extensions: string[] = ['.el'],
): string | null {
  if (!rootDir || !fs.existsSync(rootDir)) return null;

  const exts = extensions.map(e => e.toLowerCase());
  type Candidate = { file: string; mtimeMs: number };
  const candidates: Candidate[] = [];

  const walk = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!exts.includes(ext)) continue;

      let mtimeMs: number;
      try {
        mtimeMs = fs.statSync(full).mtimeMs;
      } catch {
        continue;
      }

      // Tolerância de 2s: o relatório é escrito instantes após a exceção.
      if (mtimeMs + 2000 < since.getTime()) continue;

      candidates.push({ file: full, mtimeMs });
    }
  };

  walk(rootDir);

  if (candidates.length === 0) return null;
  const newest = candidates.reduce((a, b) => (b.mtimeMs > a.mtimeMs ? b : a));
  return newest.file;
}

/** Lê o arquivo respeitando UTF-16 LE (BOM FF FE), com fallback para UTF-8. */
export function readReportFile(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString('utf16le').replace(/^\uFEFF/, '');
  }
  return buffer.toString('utf8').replace(/^\uFEFF/, '');
}

function findFieldByNumber(lines: string[], fieldNumber: string): string | undefined {
  // Ex.: "  2.6 Mensagem     : Access violation..." — casa por número, ignora rótulo.
  const re = new RegExp(`^\\s*${fieldNumber.replace('.', '\\.')}\\s+\\S[^:]*:\\s*(.+)$`);
  for (const line of lines) {
    const m = re.exec(line);
    if (m) return m[1].trim();
  }
  return undefined;
}

/**
 * Faz o parse do conteúdo de um relatório. Reconhece o layout do EurekaLog por
 * estrutura (numeração dos campos + tabela de pilha em pipe), independente do
 * idioma. Marca recognized=false quando não encontra os elementos esperados.
 */
export function parseReport(content: string): StacktraceReport {
  const lines = content.split(/\r?\n/);

  const exception: StacktraceExceptionInfo = {
    date: findFieldByNumber(lines, '2.1'),
    address: findFieldByNumber(lines, '2.2'),
    type: findFieldByNumber(lines, '2.5'),
    message: findFieldByNumber(lines, '2.6'),
  };

  const stack = parseStackFrames(lines);
  const recognized = Boolean(exception.type || exception.message) || stack.length > 0;

  return { exception, stack, recognized };
}

function parseStackFrames(lines: string[]): StacktraceFrame[] {
  const frames: StacktraceFrame[] = [];

  // Detecta o cabeçalho da tabela de pilha pelas colunas conhecidas (em qualquer
  // idioma o EurekaLog mantém a coluna "Stack" e "Offset" em inglês).
  let headerCols: string[] | null = null;
  let idx = { methods: 1, module: 5, source: 7, unit: 8, className: 9, procedure: 10, line: 11 };

  for (const line of lines) {
    if (!line.startsWith('|')) {
      // Sai da tabela quando encontra linha não-pipe após já ter cabeçalho.
      if (headerCols) headerCols = null;
      continue;
    }

    const cols = line.split('|').map(c => c.trim());

    // Linha de cabeçalho: contém as colunas "Stack" e "Offset".
    if (cols.includes('Stack') && cols.includes('Offset')) {
      headerCols = cols;
      idx = {
        methods: cols.findIndex(c => /^Methods$/i.test(c)),
        module: cols.findIndex(c => /^(Módulo|Module)$/i.test(c)),
        source: cols.findIndex(c => /^Source$/i.test(c)),
        unit: cols.findIndex(c => /^Unit$/i.test(c)),
        className: cols.findIndex(c => /^(Classe|Class)$/i.test(c)),
        procedure: cols.findIndex(c => /^(Procedimento|Procedure|Method)$/i.test(c)),
        line: cols.findIndex(c => /^Line$/i.test(c)),
      };
      continue;
    }

    if (!headerCols) continue;
    if (cols.length < headerCols.length - 1) continue;

    const at = (i: number): string => (i >= 0 && i < cols.length ? cols[i] : '');
    const module = at(idx.module);
    const source = at(idx.source);
    const unit = at(idx.unit);
    const className = at(idx.className);
    const procedure = at(idx.procedure);
    const rawLine = at(idx.line);

    // Ignora linhas de metadados de thread (ex.: começam com '*' ou vazias).
    if (!module && !procedure && !unit) continue;
    if (at(idx.methods).startsWith('*')) continue;

    const isAppFrame = /\.pas$/i.test(source) && /\.exe$/i.test(module);

    frames.push({ module, unit, className, procedure, line: rawLine, isAppFrame });
  }

  return frames;
}

/**
 * Formata o relatório para o terminal: exceção em destaque + pilha compacta,
 * realçando frames do app e limitando frames de sistema para reduzir ruído.
 */
export function formatReportForTerminal(
  report: StacktraceReport,
  filePath: string,
  options: { maxSystemFrames?: number } = {},
): string {
  const maxSystemFrames = options.maxSystemFrames ?? 6;
  const out: string[] = [];

  out.push('');
  out.push(chalk.red('  ══ Stacktrace do relatório de crash ══'));

  const ex = report.exception;
  if (ex.type || ex.message) {
    out.push(chalk.red(`  Exceção : ${ex.type ?? '(desconhecida)'}`));
    if (ex.message) out.push(chalk.red(`  Mensagem: ${ex.message}`));
    if (ex.address) out.push(chalk.gray(`  Endereço: ${ex.address}`));
    if (ex.date) out.push(chalk.gray(`  Data    : ${ex.date}`));
  }

  if (report.stack.length > 0) {
    out.push('');
    out.push(chalk.white('  Pilha de chamadas:'));

    let systemShown = 0;
    for (const frame of report.stack) {
      const qualified = [frame.unit, frame.className, frame.procedure].filter(Boolean).join('.');
      const lineInfo = frame.line ? chalk.gray(` (linha ${frame.line})`) : '';

      if (frame.isAppFrame) {
        out.push(chalk.yellow(`    → ${qualified}`) + lineInfo);
        systemShown = 0;
      } else if (systemShown < maxSystemFrames) {
        out.push(chalk.gray(`      ${qualified || frame.module}`));
        systemShown++;
      }
    }
  }

  out.push('');
  out.push(chalk.gray(`  Relatório completo: ${filePath}`));
  out.push('');

  return out.join('\n');
}

/** Formata um dump bruto (limitado) quando o formato não é reconhecido. */
export function formatRawFallback(content: string, filePath: string, maxLines = 60): string {
  const lines = content.split(/\r?\n/).slice(0, maxLines);
  const out: string[] = [];
  out.push('');
  out.push(chalk.yellow('  ══ Relatório de crash (formato não reconhecido, dump bruto) ══'));
  out.push(...lines.map(l => chalk.gray('  ' + l)));
  out.push(chalk.gray(`  ...`));
  out.push(chalk.gray(`  Relatório completo: ${filePath}`));
  out.push('');
  return out.join('\n');
}

/**
 * Fluxo de alto nível: resolve o diretório configurado, localiza o relatório
 * mais recente gerado após o início do app e o formata. Retorna null quando o
 * diretório não está configurado, não existe, ou não há relatório novo.
 */
export function buildAttachReport(
  stacktraceReportDir: string | undefined,
  envVersion: string,
  appStart: Date,
): string | null {
  if (!stacktraceReportDir || !stacktraceReportDir.trim()) return null;

  const rootDir = resolveReportDirTemplate(stacktraceReportDir, envVersion);
  const file = findLatestReport(rootDir, appStart);
  if (!file) return null;

  const content = readReportFile(file);
  const report = parseReport(content);

  if (!report.recognized) {
    return formatRawFallback(content, file);
  }
  return formatReportForTerminal(report, file);
}
