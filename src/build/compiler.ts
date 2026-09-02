import execa from 'execa';
import { spawn, SpawnOptions } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { BuildOptions } from '../types';
import { fatal, step } from '../ui/output';
import { buildCompilerFlags, getDcc64Command, resolveEnvTemplate } from './dcc64-args';
import { formatDiagnosticsReport, parseDcc64Diagnostics } from './diagnostics';
import { buildAttachReport } from './stacktrace-report';

export { buildCompilerFlags };

const delphiEnvCache = new Map<string, NodeJS.ProcessEnv>();

function parseWindowsEnv(output: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};

  for (const line of output.split(/\r?\n/)) {
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    if (!key) continue;

    env[key] = value;
  }

  return env;
}

async function getDelphiEnvironment(delphiDir: string): Promise<NodeJS.ProcessEnv> {
  const cached = delphiEnvCache.get(delphiDir);
  if (cached) {
    return cached;
  }

  const rsvarsPath = path.win32.join(delphiDir, 'bin', 'rsvars.bat');

  if (!fs.existsSync(rsvarsPath)) {
    fatal(`Arquivo não encontrado: ${rsvarsPath}`);
  }

  try {
    const command = `call "${rsvarsPath}" >nul && set`;
    const result = await execa('cmd.exe', ['/d', '/c', command], {
      env: process.env,
      windowsVerbatimArguments: true,
    });

    const resolved = {
      ...process.env,
      ...parseWindowsEnv(result.stdout),
    };

    delphiEnvCache.set(delphiDir, resolved);
    return resolved;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fatal(`Falha ao carregar o ambiente do Delphi via rsvars.bat (${rsvarsPath}). Detalhe: ${message}`);
  }
}

export async function ensureDelphiEnvironment(delphiDir: string): Promise<void> {
  await getDelphiEnvironment(delphiDir);
}

export async function runCgrc(opts: BuildOptions, projectName: string): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `BimerBuild_${projectName}`);
  const vrcFile = path.join(tempDir, `${projectName}.vrc`);
  const resFile = path.join(tempDir, `${projectName}.res`);
  const delphiEnv = await getDelphiEnvironment(opts.delphiDir);

  try {
    await execa(
      path.win32.join(opts.delphiDir, 'bin', 'cgrc.exe'),
      [vrcFile, `-fo${resFile}`],
      {
        env: delphiEnv,
        stdio: 'inherit',
      }
    );
  } catch {
    fatal('Falha do compilador CGRC ao gerar o arquivo de recursos .res.');
  }

  return resFile;
}

export async function runDcc64(opts: BuildOptions, projectName: string, workspaceDir: string): Promise<void> {
  const { exe, args, exeOutputDir, dcuOutputDir } = getDcc64Command(opts, projectName);
  const delphiEnv = await getDelphiEnvironment(opts.delphiDir);

  if (!fs.existsSync(exeOutputDir)) fs.mkdirSync(exeOutputDir, { recursive: true });
  if (!fs.existsSync(dcuOutputDir)) fs.mkdirSync(dcuOutputDir, { recursive: true });

  // Captura a saída do compilador em buffer E transmite ao terminal em tempo
  // real (tee), preservando a experiência de acompanhar a compilação ao vivo
  // e permitindo, ao final, parsear os diagnósticos (erros/warnings/hints).
  let captured = '';
  const subprocess = execa(exe, args, {
    cwd: workspaceDir,
    env: delphiEnv,
    all: true,
    buffer: false,
  });

  if (subprocess.all) {
    subprocess.all.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      captured += text;
      process.stdout.write(text);
    });
  }

  try {
    await subprocess;
  } catch {
    printDiagnosticsSummary(captured);
    fatal('Falha na compilação do Delphi. Verifique os diagnósticos acima.');
    return;
  }

  printDiagnosticsSummary(captured);
}

function printDiagnosticsSummary(output: string): void {
  const diagnostics = parseDcc64Diagnostics(output);
  const report = formatDiagnosticsReport(diagnostics);
  if (report) {
    console.log('');
    console.log(report);
  }
}

export async function runBuiltExecutable(opts: BuildOptions, projectName: string): Promise<void> {
  const { runAfter } = buildCompilerFlags(opts.type);

  if (!runAfter) return;

  const exeOut = path.win32.join(resolveEnvTemplate(opts.exeOutputDir, opts.envVersion), `${projectName}.exe`);

  if (opts.attach) {
    step(`Iniciando ${projectName}.exe anexado ao terminal (Ctrl+C para encerrar)...`);
  } else {
    step(`Iniciando ${projectName}.exe...`);
  }

  const { spawnOptions, waitForExit } = getRunExecutableSpawnOptions(opts, exeOut);
  const appStart = new Date();
  const child = spawn(exeOut, [], spawnOptions);

  if (waitForExit) {
    // Modo attach: mantém o processo do bbuilder vivo aguardando o app encerrar,
    // propagando stdout/stderr (incluindo stacktrace) ao terminal via 'inherit'.
    await new Promise<void>((resolve) => {
      child.on('exit', (code) => {
        step(`${projectName}.exe encerrado (código ${code ?? 0}).`);
        resolve();
      });
      child.on('error', (err) => {
        // Ex.: EXE inexistente. Informa o usuário em vez de falhar em silêncio.
        step(`Não foi possível iniciar ${projectName}.exe: ${err.message}`);
        resolve();
      });
    });

    // Após o encerramento, se um diretório de relatórios estiver configurado,
    // procura e imprime o relatório de crash mais recente gerado nesta execução.
    // Genérico: só age se stacktraceReportDir estiver definido na config.
    try {
      const report = buildAttachReport(opts.stacktraceReportDir, opts.envVersion, appStart);
      if (report) {
        console.log(report);
      }
    } catch {
      // Impressão do relatório é best-effort; nunca deve derrubar o build.
    }
    return;
  }

  // Fire-and-forget real: usamos child_process.spawn nativo (não execa) para
  // NÃO criar uma promise pendente que mantenha o event loop do bbuilder vivo.
  // Com detached + stdio ignorado + unref(), o EXE roda totalmente independente
  // do terminal — assim o console é liberado imediatamente e não fica preso
  // enquanto o app (ou uma sessão de debug anexada a ele) está aberto.
  // Handler de 'error' evita que uma falha de spawn (ex.: EXE inexistente)
  // vire um erro não tratado que derrubaria o processo do bbuilder.
  child.on('error', () => undefined);
  child.unref();
}

/**
 * Decide como o executável gerado deve ser iniciado.
 *
 * - Modo padrão (attach=false): desanexado, saída ignorada, terminal liberado
 *   imediatamente. Nenhum stacktrace/log do app chega ao console.
 * - Modo attach=true: anexado ao terminal com stdio 'inherit', de forma que
 *   logs e stacktrace do app apareçam no console. O bbuilder aguarda o app
 *   encerrar (waitForExit=true).
 *
 * Função pura (não faz spawn) para permitir teste unitário do comportamento.
 */
export function getRunExecutableSpawnOptions(
  opts: Pick<BuildOptions, 'attach'>,
  exeOut: string,
): { spawnOptions: SpawnOptions; waitForExit: boolean } {
  const cwd = path.win32.dirname(exeOut);

  if (opts.attach) {
    return {
      spawnOptions: { detached: false, stdio: 'inherit', cwd },
      waitForExit: true,
    };
  }

  return {
    spawnOptions: { detached: true, stdio: 'ignore', cwd },
    waitForExit: false,
  };
}
