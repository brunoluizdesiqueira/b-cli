import chalk from 'chalk';

import { BuildOptions, BuildType } from '../types';

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

function visibleLength(value: string): number {
  const text = value.replace(ANSI_PATTERN, '');
  let length = 0;

  for (const char of text) {
    const code = char.codePointAt(0) || 0;

    if (
      (code >= 0x0300 && code <= 0x036f) ||
      (code >= 0x1ab0 && code <= 0x1aff) ||
      (code >= 0x1dc0 && code <= 0x1dff) ||
      (code >= 0x20d0 && code <= 0x20ff) ||
      (code >= 0xfe20 && code <= 0xfe2f)
    ) {
      continue;
    }

    if (
      code >= 0x1100 &&
      (code <= 0x115f ||
        code === 0x2329 ||
        code === 0x232a ||
        (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
        (code >= 0xac00 && code <= 0xd7a3) ||
        (code >= 0xf900 && code <= 0xfaff) ||
        (code >= 0xfe10 && code <= 0xfe19) ||
        (code >= 0xfe30 && code <= 0xfe6f) ||
        (code >= 0xff00 && code <= 0xff60) ||
        (code >= 0xffe0 && code <= 0xffe6))
    ) {
      length += 2;
      continue;
    }

    length += 1;
  }

  return length;
}

export function banner(): void {
  const art = [
    '  ███   ███   █  █ ███ █    ████ ████ ███ ',
    '  █  █  █  █  █  █  █  █    █  █ █    █  █',
    '  ███   ███   █  █  █  █    █  █ ███  ███ ',
    '  █  █  █  █  █  █  █  █    █  █ █    █ █ ',
    '  ███   ███    ███ ███ ████ ████ ████ █  █',
  ];

  console.log('');
  art.forEach((line, index) => {
    const color = index === 0 || index === art.length - 1 ? chalk.gray : chalk.white;
    console.log(color(line));
  });
  console.log(chalk.gray('  ──────────────────────────────────────────────────────────────────────────────'));
  console.log(chalk.cyan('  BBuilder') + chalk.gray('  local delphi build runner'));
  console.log(chalk.gray('  doctor') + chalk.gray('  ambiente  ·  ') + chalk.gray('config') + chalk.gray('  projeto  ·  ') + chalk.gray('build') + chalk.gray('  execucao'));
  console.log('');
}

export function printBuildHeader(opts: BuildOptions, projectName: string, workspaceDir: string): void {
  const typeColor: Record<BuildType, chalk.Chalk> = {
    FAST: chalk.yellow,
    DEBUG: chalk.cyan,
    RELEASE: chalk.green,
  };
  const col = typeColor[opts.type];
  const rows = [
    `${chalk.magenta('[ PROJETO ]')} ${chalk.white(projectName)}`,
    `${chalk.magenta('[ CAMINHO ]')} ${chalk.white(workspaceDir)}`,
    `${chalk.magenta('[ VERSÃO  ]')} ${chalk.yellow(opts.version || '(atual)')} (Base: ${opts.envVersion})`,
    `${chalk.magenta('[ PROFILE ]')} ${col(opts.type)}`,
  ];
  const boxWidth = Math.max(...rows.map(visibleLength));

  console.log(chalk.gray(`  ┌${'─'.repeat(boxWidth + 2)}┐`));
  rows.forEach(row => {
    const padding = ' '.repeat(Math.max(0, boxWidth - visibleLength(row)));
    console.log(chalk.gray('  │ ') + row + padding + chalk.gray(' │'));
  });
  console.log(chalk.gray(`  └${'─'.repeat(boxWidth + 2)}┘`));
  console.log('');
}

export function printSuccess(buildType: BuildType): void {
  console.log('');
  const art = [
    '  ████  █   █  ███   ███   ████  ████  ████ ',
    '  █     █   █ █   █ █   █  █     █     █    ',
    '  ███   █   █ █     █     ███    ███   ███  ',
    '     █  █   █ █   █ █   █  █        █     █ ',
    '  ████   ███   ███   ███   ████  ████  ████ ',
  ];

  art.forEach((line, index) => {
    const color = index === 0 || index === art.length - 1 ? chalk.green : chalk.white;
    console.log(color(line));
  });
  console.log(chalk.green('  ──────────────────────────────────────────────────────────────'));
  console.log(chalk.cyan('  [ok] ') + chalk.white('Build ') + chalk.yellow(buildType) + chalk.white(' finalizado com sucesso.'));
  console.log(chalk.cyan('  [ok] ') + chalk.white('Artefatos validados e recursos aplicados.'));
  console.log(chalk.cyan('  [run]') + chalk.white(' Pipeline concluído.'));
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
