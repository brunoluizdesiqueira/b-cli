import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

import { Config } from '../types';

interface CheckResult {
  label: string;
  ok: boolean;
  detail: string;
}

function checkPath(label: string, targetPath: string): CheckResult {
  return {
    label,
    ok: fs.existsSync(targetPath),
    detail: targetPath,
  };
}

function checkFile(label: string, targetPath: string): CheckResult {
  return {
    label,
    ok: fs.existsSync(targetPath) && fs.statSync(targetPath).isFile(),
    detail: targetPath,
  };
}

function printCheck(result: CheckResult): void {
  const status = result.ok ? chalk.green('OK') : chalk.red('FAIL');
  console.log(`  ${status.padEnd(6)} ${chalk.white(result.label)} ${chalk.gray(`→ ${result.detail}`)}`);
}

export function runDoctor(config: Config, resolvedConfigPath: string): void {
  const checks: CheckResult[] = [];
  const cgrcPath = path.win32.join(config.delphiDir, 'bin', 'cgrc.exe');
  const dcc64Path = path.win32.join(config.delphiDir, 'bin', 'dcc64.exe');
  const delphiRuntimePath = path.win32.join(config.delphiDir, 'lib', 'Win64', 'release');

  checks.push(checkFile('Arquivo de configuração em uso', resolvedConfigPath));
  checks.push(checkPath('repoBase', config.repoBase));
  checks.push(checkPath('delphiDir', config.delphiDir));
  checks.push(checkPath('Delphi runtime Win64', delphiRuntimePath));
  checks.push(checkPath('libRoot', config.libRoot));
  checks.push(checkPath('libErp', config.libErp));
  checks.push(checkPath('libAlterdata', config.libAlterdata));
  checks.push(checkFile('cgrc.exe', cgrcPath));
  checks.push(checkFile('dcc64.exe', dcc64Path));

  const projectEntries = Object.entries(config.projects);
  checks.push({
    label: 'Projetos configurados',
    ok: projectEntries.length > 0,
    detail: `${projectEntries.length} projeto(s)`,
  });

  checks.push({
    label: 'dependencyPaths configurados',
    ok: Array.isArray(config.dependencyPaths) && config.dependencyPaths.length > 0,
    detail: `${config.dependencyPaths.length} path(s)`,
  });
  checks.push({
    label: 'Delphi runtime presente em dependencyPaths',
    ok: config.dependencyPaths.includes(delphiRuntimePath),
    detail: delphiRuntimePath,
  });

  console.log('');
  console.log(chalk.cyan('  Diagnóstico do Ambiente'));
  console.log(chalk.blue('  ───────────────────────'));
  console.log(chalk.gray(`  Config: ${resolvedConfigPath}`));
  console.log('');

  checks.forEach(printCheck);

  if (projectEntries.length > 0) {
    console.log('');
    console.log(chalk.cyan('  Projetos'));
    console.log(chalk.blue('  ────────'));
    projectEntries.forEach(([name, projectPath]) => {
      const fullPath = path.win32.join(config.repoBase, projectPath);
      const dprojPath = `${fullPath}.dproj`;
      const exists = fs.existsSync(dprojPath);
      const status = exists ? chalk.green('OK') : chalk.red('FAIL');
      console.log(`  ${status.padEnd(6)} ${chalk.white(name)} ${chalk.gray(`→ ${dprojPath}`)}`);
    });
  }

  if (config.dependencyPaths.length > 0) {
    console.log('');
    console.log(chalk.cyan('  Dependências'));
    console.log(chalk.blue('  ────────────'));
    config.dependencyPaths.forEach(depPath => {
      const exists = fs.existsSync(depPath);
      const status = exists ? chalk.green('OK') : chalk.yellow('WARN');
      console.log(`  ${status.padEnd(6)} ${chalk.gray(depPath)}`);
    });
  }

  const failed = checks.filter(check => !check.ok).length;
  console.log('');
  if (failed === 0) {
    console.log(chalk.green('  Ambiente básico validado com sucesso.'));
  } else {
    console.log(chalk.yellow(`  Diagnóstico concluído com ${failed} problema(s) principal(is).`));
    process.exitCode = 1;
  }
  console.log('');
}
