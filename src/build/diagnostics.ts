import chalk from 'chalk';

/**
 * Parser de diagnósticos da saída do compilador dcc64 (Delphi).
 *
 * Formato real observado (Delphi 35.0, com -Q):
 *   Probe.dpr(9) Warning: W1035 Return value of function 'Foo' might be undefined
 *   Probe.dpr(5) Hint: H2164 Variable 'Unused' is declared but never used in 'Foo'
 *   Probe.dpr(12) Error: E2003 Undeclared identifier: 'UndeclaredIdentifier'
 *   Probe2.dpr(4) Fatal: F2613 Unit 'UnitQueNaoExiste' not found.
 *
 * Padrão: <arquivo>(<linha>) <Severidade>: <Código> <mensagem>
 */

export type Severity = 'hint' | 'warning' | 'error' | 'fatal';

export interface Diagnostic {
  file: string;
  line: number;
  severity: Severity;
  code: string;
  message: string;
}

export interface DiagnosticsSummary {
  hints: number;
  warnings: number;
  errors: number;
  fatals: number;
  /** true se há qualquer erro ou fatal (build deve ser considerado falho). */
  hasBlocking: boolean;
}

// Grupo 1: arquivo (qualquer coisa até o "("), 2: linha, 3: severidade textual,
// 4: código (letra + dígitos), 5: mensagem.
const DIAG_RE = /^(.+?)\((\d+)\)\s+(Hint|Warning|Error|Fatal):\s+([A-Z]\d{3,5})\s+(.*)$/;

const SEVERITY_MAP: Record<string, Severity> = {
  Hint: 'hint',
  Warning: 'warning',
  Error: 'error',
  Fatal: 'fatal',
};

export function parseDcc64Diagnostics(output: string): Diagnostic[] {
  if (!output) return [];

  const diagnostics: Diagnostic[] = [];

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const match = DIAG_RE.exec(line);
    if (!match) continue;

    const [, file, lineNo, severityText, code, message] = match;
    diagnostics.push({
      file: file.trim(),
      line: Number(lineNo),
      severity: SEVERITY_MAP[severityText],
      code,
      message: message.trim(),
    });
  }

  return diagnostics;
}

export function summarizeDiagnostics(diagnostics: Diagnostic[]): DiagnosticsSummary {
  const summary: DiagnosticsSummary = {
    hints: 0,
    warnings: 0,
    errors: 0,
    fatals: 0,
    hasBlocking: false,
  };

  for (const d of diagnostics) {
    switch (d.severity) {
      case 'hint': summary.hints++; break;
      case 'warning': summary.warnings++; break;
      case 'error': summary.errors++; break;
      case 'fatal': summary.fatals++; break;
    }
  }

  summary.hasBlocking = summary.errors + summary.fatals > 0;
  return summary;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLine(d: Diagnostic): string {
  const location = `${d.file}:${d.line}`;
  return `  ${location}  ${d.code}  ${d.message}`;
}

/**
 * Formata um relatório legível dos diagnósticos. Retorna string vazia quando
 * não há nenhum diagnóstico. Erros e fatais são destacados; warnings e hints
 * são contabilizados e listados de forma resumida.
 */
export function formatDiagnosticsReport(diagnostics: Diagnostic[]): string {
  if (diagnostics.length === 0) return '';

  const summary = summarizeDiagnostics(diagnostics);
  const blocking = summary.errors + summary.fatals;
  const lines: string[] = [];

  const headerParts = [
    pluralize(blocking, 'erro', 'erros'),
    pluralize(summary.warnings, 'warning', 'warnings'),
    pluralize(summary.hints, 'hint', 'hints'),
  ];
  lines.push(chalk.blue('  ── Diagnósticos do compilador ──'));
  lines.push('  ' + headerParts.join(', '));

  const errorsAndFatals = diagnostics.filter(
    d => d.severity === 'error' || d.severity === 'fatal',
  );
  if (errorsAndFatals.length > 0) {
    lines.push('');
    lines.push(chalk.red('  ERROS:'));
    for (const d of errorsAndFatals) {
      lines.push(chalk.red(formatLine(d)));
    }
  }

  const warnings = diagnostics.filter(d => d.severity === 'warning');
  if (warnings.length > 0) {
    lines.push('');
    lines.push(chalk.yellow('  WARNINGS:'));
    for (const d of warnings) {
      lines.push(chalk.yellow(formatLine(d)));
    }
  }

  const hints = diagnostics.filter(d => d.severity === 'hint');
  if (hints.length > 0) {
    lines.push('');
    lines.push(chalk.gray('  HINTS:'));
    for (const d of hints) {
      lines.push(chalk.gray(formatLine(d)));
    }
  }

  return lines.join('\n');
}
