import chalk from 'chalk';

import { BuildOptions, BuildType } from '../types';

export function banner(): void {
  console.log('');
  console.log(chalk.blue('  ══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan('     ____  _                     ____        _ __    __        '));
  console.log(chalk.cyan('    / __ )(_)___ ___  ___  _____/ __ )__  __(_) /___/ /        '));
  console.log(chalk.cyan('   / __  / / __ `__ \\/ _ \\/ ___/ __  / / / / / / __  /         '));
  console.log(chalk.cyan('  / /_/ / / / / / / /  __/ /  / /_/ / /_/ / / / /_/ /          '));
  console.log(chalk.cyan(' /_____/_/_/ /_/ /_/\\___/_/  /_____/\\__,_/_/_/\\__,_/           '));
  console.log(chalk.blue('  ──────────────────────────────────────────────────────────────'));
  console.log(chalk.green('  [+]') + chalk.white(' Iniciando Pipeline DevOps Local...      ') + chalk.green('[ RUNNING ]'));
  console.log(chalk.green('  [+]') + chalk.white(' Engatando Motor Embarcadero...          ') + chalk.green('[ STANDBY ]'));
  console.log(chalk.green('  [+]') + chalk.white(' Sanitizando Caches Fantasmas...         ') + chalk.green('[ CLEARED ]'));
  console.log(chalk.blue('  ══════════════════════════════════════════════════════════════'));
  console.log('');
}

export function printBuildHeader(opts: BuildOptions, projectName: string, workspaceDir: string): void {
  const typeColor: Record<BuildType, chalk.Chalk> = {
    FAST: chalk.yellow,
    DEBUG: chalk.cyan,
    RELEASE: chalk.green,
  };
  const col = typeColor[opts.type];

  console.log(chalk.magenta('  [ PROJETO ]') + ' ' + chalk.white(projectName));
  console.log(chalk.magenta('  [ CAMINHO ]') + ' ' + chalk.white(workspaceDir));
  console.log(chalk.magenta('  [ VERSÃO  ]') + ' ' + chalk.yellow(opts.version || '(atual)') + ` (Base: ${opts.envVersion})`);
  console.log(chalk.magenta('  [ PROFILE ]') + ' ' + col(opts.type));
  console.log(chalk.blue('  ──────────────────────────────────────────────────────────────'));
  console.log('');
}

export function printSuccess(buildType: BuildType): void {
  console.log('');
  console.log(chalk.red('       .oooooo.         ') + chalk.green(' _____________________________________________'));
  console.log(chalk.red('     .o00000000o.       ') + chalk.green('   _____ _    _  _____ _____ ______  _____ _____ '));
  console.log(chalk.red('    .00') + chalk.white('######') + chalk.red('0000.      ') + chalk.green('  / ____| |  | |/ ____/ ____|  ____/ ____|/ ____|'));
  console.log(chalk.red('    000') + chalk.white('##') + chalk.red('0000') + chalk.white('##') + chalk.red('000      ') + chalk.green(' | (___ | |  | | |   | |    | |__  \\___  \\___  |'));
  console.log(chalk.red('    000') + chalk.white('##') + chalk.red('00000') + chalk.white('##') + chalk.red('00      ') + chalk.green('  \\___ \\| |  | | |   | |    |  __|  ___ \\  ___ |'));
  console.log(chalk.red('    000') + chalk.white('##') + chalk.red('0000') + chalk.white('##') + chalk.red('000      ') + chalk.green('  ____) | |__| | |___| |____| |____ ____) |____) |'));
  console.log(chalk.red("    `00") + chalk.white('######') + chalk.red("0000'      ") + chalk.green(' |_____/ \\____/ \\_____\\_____|______|_____/|_____/'));
  console.log(chalk.red("     `o00000000o'       ") + chalk.green(' _____________________________________________'));
  console.log(chalk.red("       `oooooo'         ") + chalk.cyan('  [*] ') + chalk.white('Build ') + chalk.yellow(buildType) + chalk.white(' finalizado com êxito absoluto!'));
  console.log(chalk.red('                        ') + chalk.cyan('  [*] ') + chalk.white('Artefatos validados, versionados e linkados na raiz.'));
  console.log(chalk.red('                        ') + chalk.green('  [ RUN ] O ecossistema está pronto para combate.'));
  console.log(chalk.green('                        _____________________________________________'));
  console.log('');
}

export function step(msg: string): void {
  console.log(chalk.cyan('  [*]') + ' ' + chalk.white(msg));
}

export function formatElapsedMs(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export async function withStep<T>(
  stage: number,
  total: number,
  label: string,
  task: () => Promise<T> | T,
  options?: { streamingOutput?: boolean }
): Promise<T> {
  const startTime = Date.now();
  const prefix = `[${stage}/${total}] ${label}`;

  step(prefix);

  try {
    const result = await task();
    console.log(`  ${chalk.green('OK')} ${chalk.white(label)} ${chalk.gray(`(${formatElapsedMs(Date.now() - startTime)})`)}`);
    return result;
  } catch (error) {
    console.log(`  ${chalk.red('FAIL')} ${chalk.white(label)} ${chalk.gray(`(${formatElapsedMs(Date.now() - startTime)})`)}`);
    throw error;
  }
}

export async function withProgress<T>(
  stage: number,
  total: number,
  label: string,
  task: () => Promise<T> | T,
  options?: { streamingOutput?: boolean; minVisibleMs?: number }
): Promise<T> {
  return withStep(stage, total, label, task, options);
}

export function fatal(msg: string): never {
  console.error('');
  console.error(chalk.red('  [ERRO FATAL] ') + msg);
  console.error('');
  process.exit(1);
}
