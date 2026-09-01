import execa from 'execa';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { BuildOptions } from '../types';
import { fatal, step } from '../ui/output';
import { buildCompilerFlags, getDcc64Command, resolveEnvTemplate } from './dcc64-args';

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

  try {
    await execa(exe, args, {
      cwd: workspaceDir,
      env: delphiEnv,
      stdio: 'inherit',
    });
  } catch {
    fatal('Falha na compilação do Delphi. Verifique os logs de erro acima.');
  }
}

export function runBuiltExecutable(opts: BuildOptions, projectName: string): void {
  const { runAfter } = buildCompilerFlags(opts.type);

  if (!runAfter) return;

  const exeOut = path.win32.join(resolveEnvTemplate(opts.exeOutputDir, opts.envVersion), `${projectName}.exe`);
  step(`Iniciando ${projectName}.exe...`);

  // Fire-and-forget real: usamos child_process.spawn nativo (não execa) para
  // NÃO criar uma promise pendente que mantenha o event loop do bbuilder vivo.
  // Com detached + stdio ignorado + unref(), o EXE roda totalmente independente
  // do terminal — assim o console é liberado imediatamente e não fica preso
  // enquanto o app (ou uma sessão de debug anexada a ele) está aberto.
  const child = spawn(exeOut, [], {
    detached: true,
    stdio: 'ignore',
    cwd: path.win32.dirname(exeOut),
  });
  child.on('error', () => undefined);
  child.unref();
}
