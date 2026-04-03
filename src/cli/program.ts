import { Command } from 'commander';
import chalk from 'chalk';

import { executeBuild } from '../build/execute';
import { loadConfig } from '../config/config';
import { BuildType } from '../types';
import { banner, fatal } from '../ui/output';
import { promptBuild, runConfigInit, runProjectAdd } from '../ui/prompts';

export async function runCli(argv: string[]): Promise<void> {
  const config = loadConfig();
  const program = new Command();

  program
    .name('bimer')
    .description('CLI de build local para projetos Delphi do Bimer')
    .version('1.0.0');

  program
    .command('build')
    .description('Compila um projeto Delphi (interativo se flags omitidas)')
    .option('-t, --type <FAST|DEBUG|RELEASE>', 'Modo de build')
    .option('-p, --project <path>', 'Caminho do projeto (ex: faturamento\\BimerFaturamento)')
    .option('-v, --version <version>', 'Versão a injetar (ex: 11.2.4)')
    .action(async (opts) => {
      const buildType = opts.type?.toUpperCase() as BuildType | undefined;
      if (buildType && !['FAST', 'DEBUG', 'RELEASE'].includes(buildType)) {
        fatal(`Tipo de build inválido: "${opts.type}". Use FAST, DEBUG ou RELEASE.`);
      }

      const resolved = await promptBuild(config, buildType, opts.project, opts.version);
      await executeBuild(resolved);
    });

  for (const type of ['fast', 'debug', 'release'] as const) {
    program
      .command(type)
      .description(`Compila no modo ${type.toUpperCase()} (interativo para projeto/versão)`)
      .option('-p, --project <path>', 'Caminho do projeto')
      .option('-v, --version <version>', 'Versão a injetar')
      .action(async (opts) => {
        const resolved = await promptBuild(config, type.toUpperCase() as BuildType, opts.project, opts.version);
        await executeBuild(resolved);
      });
  }

  const configCmd = program
    .command('config')
    .description('Gerencia a configuração do ambiente');

  configCmd
    .command('init')
    .description('Configura o ambiente de forma interativa (cria bimer.config.json)')
    .action(() => runConfigInit(config));

  configCmd
    .command('show')
    .description('Exibe a configuração atual')
    .action(() => {
      console.log('');
      console.log(chalk.cyan('  Configuração Atual'));
      console.log(chalk.blue('  ──────────────────'));
      console.log(JSON.stringify(config, null, 2)
        .split('\n')
        .map(line => '  ' + line)
        .join('\n'));
      console.log('');
    });

  const projectCmd = program
    .command('project')
    .description('Gerencia a lista de projetos');

  projectCmd
    .command('add')
    .description('Adiciona um novo projeto à lista')
    .action(() => runProjectAdd(config));

  projectCmd
    .command('list')
    .description('Lista todos os projetos configurados')
    .action(() => {
      console.log('');
      console.log(chalk.cyan('  Projetos Configurados'));
      console.log(chalk.blue('  ─────────────────────'));
      Object.entries(config.projects).forEach(([name, projectPath], index) => {
        console.log(`  ${chalk.yellow(String(index + 1).padStart(2))}. ${chalk.white(name)} ${chalk.gray(`→ ${projectPath}`)}`);
      });
      console.log('');
    });

  if (argv.length <= 2) {
    banner();
    const resolved = await promptBuild(config);
    await executeBuild(resolved);
    return;
  }

  await program.parseAsync(argv);
}
