import chalk from 'chalk';
import * as readline from 'readline';

import { BuildOptions, BuildType } from '../types';

const SPINNER_FRAMES = ['|', '/', '-', '\\'];
const BAR_WIDTH = 18;
const BAR_SEGMENT = 6;

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

function formatElapsed(startTime: number): string {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function buildIndeterminateBar(frameIndex: number): string {
  const chars = new Array(BAR_WIDTH).fill('░');
  const start = frameIndex % (BAR_WIDTH + BAR_SEGMENT);

  for (let offset = 0; offset < BAR_SEGMENT; offset++) {
    const position = start - offset;
    if (position >= 0 && position < BAR_WIDTH) {
      chars[position] = '█';
    }
  }

  return chars.join('');
}

function truncateLabel(label: string, maxLength: number): string {
  if (maxLength <= 0) return '';
  if (label.length <= maxLength) return label;
  if (maxLength <= 1) return label.slice(0, maxLength);
  return `${label.slice(0, maxLength - 1)}…`;
}

function renderProgressLine(stage: number, total: number, label: string, startTime: number, frameIndex: number): string {
  const spinner = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
  const bar = buildIndeterminateBar(frameIndex);
  const elapsed = formatElapsed(startTime);
  const columns = process.stdout.columns || 100;
  const reservedLength = 2 + `[${stage}/${total}]`.length + 1 + 1 + 1 + 1 + 1 + (BAR_WIDTH + 2) + 1 + elapsed.length;
  const maxLabelLength = Math.max(12, columns - reservedLength);
  const safeLabel = truncateLabel(label, maxLabelLength);
  return `  ${chalk.cyan(`[${stage}/${total}]`)} ${chalk.yellow(spinner)} ${chalk.white(safeLabel)} ${chalk.blue(`[${bar}]`)} ${chalk.gray(elapsed)}`;
}

function drawProgressLine(line: string): void {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(line);
}

function clearProgressLine(): void {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
}

export async function withProgress<T>(
  stage: number,
  total: number,
  label: string,
  task: () => Promise<T> | T
): Promise<T> {
  const startTime = Date.now();

  if (!process.stdout.isTTY) {
    step(`[${stage}/${total}] ${label}`);
    const result = await task();
    console.log(`  ${chalk.green('OK')} ${chalk.white(label)} ${chalk.gray(`(${formatElapsed(startTime)})`)}`);
    return result;
  }

  let frameIndex = 0;
  drawProgressLine(renderProgressLine(stage, total, label, startTime, frameIndex));

  const timer = setInterval(() => {
    frameIndex += 1;
    drawProgressLine(renderProgressLine(stage, total, label, startTime, frameIndex));
  }, 120);

  try {
    const result = await task();
    clearInterval(timer);
    clearProgressLine();
    console.log(`  ${chalk.green('OK')} ${chalk.white(label)} ${chalk.gray(`(${formatElapsed(startTime)})`)}`);
    return result;
  } catch (error) {
    clearInterval(timer);
    clearProgressLine();
    console.log(`  ${chalk.red('FAIL')} ${chalk.white(label)} ${chalk.gray(`(${formatElapsed(startTime)})`)}`);
    throw error;
  }
}

export function fatal(msg: string): never {
  console.error('');
  console.error(chalk.red('  [ERRO FATAL] ') + msg);
  console.error('');
  process.exit(1);
}
