import { Command } from 'commander';
import chalk from 'chalk';

import { executeBuild } from '../build/execute';
import { CONFIG_ENV_VAR, getWritableConfigPath, loadConfig, resolveConfigPath } from '../config/config';
import { runConfigValidate } from '../config/validate';
import { runDoctor } from '../diagnostics/doctor';
import { BuildType } from '../types';
import { banner, fatal } from '../ui/output';
import { promptBuild, runConfigInit, runProjectAdd } from '../ui/prompts';

const packageJson = require('../../package.json') as { version: string };
const HELP_EXAMPLES = {
  root: [
    'Exemplos:',
    '  bbuilder',
    '  bbuilder build --type DEBUG --project faturamento\\BimerFaturamento',
    '  bbuilder fast --project Bimer',
    '  bbuilder --config C:\\configs\\bbuilder.config.json doctor',
  ].join('\n'),
  build: [
    'Exemplos:',
    '  bbuilder build',
    '  bbuilder build --type RELEASE --project Bimer --version 11.3.1',
    '  bbuilder build --type FAST --project faturamento\\BimerFaturamento',
  ].join('\n'),
  fast: [
    'Exemplos:',
    '  bbuilder fast',
    '  bbuilder fast --project Bimer',
    '  bbuilder fast --project faturamento\\BimerFaturamento --version 11.3.1',
  ].join('\n'),
  debug: [
    'Exemplos:',
    '  bbuilder debug',
    '  bbuilder debug --project Bimer',
    '  bbuilder debug --project faturamento\\BimerFaturamento --version 11.3.1',
  ].join('\n'),
  release: [
    'Exemplos:',
    '  bbuilder release',
    '  bbuilder release --project Bimer',
    '  bbuilder release --project faturamento\\BimerFaturamento --version 11.3.1',
  ].join('\n'),
  config: [
    'Exemplos:',
    '  bbuilder config init',
    '  bbuilder config show',
    '  bbuilder config validate',
    '  bbuilder --config C:\\configs\\bbuilder.config.json config show',
  ].join('\n'),
  configValidate: [
    'Exemplos:',
    '  bbuilder config validate',
    '  bbuilder --config C:\\configs\\bbuilder.config.json config validate',
  ].join('\n'),
  project: [
    'Exemplos:',
    '  bbuilder project list',
    '  bbuilder project add',
  ].join('\n'),
  doctor: [
    'Exemplos:',
    '  bbuilder doctor',
    '  bbuilder --config C:\\configs\\bbuilder.config.json doctor',
  ].join('\n'),
};

function attachHelpExamples(command: Command, examples: string): Command {
  command.on('--help', () => {
    console.log('');
    console.log(examples);
    console.log('');
  });

  return command;
}

export async function runCli(argv: string[]): Promise<void> {
  const resolvedConfigPath = resolveConfigPath(argv);
  const writableConfigPath = getWritableConfigPath(resolvedConfigPath);
  const config = loadConfig(resolvedConfigPath);
  const program = new Command();

  attachHelpExamples(
    program
    .name('bbuilder')
    .description('CLI de build local para projetos Delphi do Bimer')
    .version(packageJson.version)
    .option('-c, --config <path>', `Caminho do arquivo de configuração (ou ${CONFIG_ENV_VAR})`),
    HELP_EXAMPLES.root
  );

  const buildCmd = attachHelpExamples(
    program
    .command('build')
    .description('Compila um projeto Delphi (interativo se flags omitidas)')
    .option('-t, --type <FAST|DEBUG|RELEASE>', 'Modo de build')
    .option('-p, --project <path>', 'Caminho do projeto (ex: faturamento\\BimerFaturamento)')
    .option('-v, --version <version>', 'Versão a injetar (ex: 11.2.4)'),
    HELP_EXAMPLES.build
  )
    .action(async (opts) => {
      const buildType = opts.type?.toUpperCase() as BuildType | undefined;
      if (buildType && !['FAST', 'DEBUG', 'RELEASE'].includes(buildType)) {
        fatal(`Tipo de build inválido: "${opts.type}". Use FAST, DEBUG ou RELEASE.`);
      }

      const resolved = await promptBuild(config, buildType, opts.project, opts.version);
      await executeBuild(resolved);
    });

  for (const type of ['fast', 'debug', 'release'] as const) {
    const shortcutCmd = program
      .command(type)
      .description(`Compila no modo ${type.toUpperCase()} (interativo para projeto/versão)`)
      .option('-p, --project <path>', 'Caminho do projeto')
      .option('-v, --version <version>', 'Versão a injetar')
      .action(async (opts) => {
        const resolved = await promptBuild(config, type.toUpperCase() as BuildType, opts.project, opts.version);
        await executeBuild(resolved);
      });

    attachHelpExamples(shortcutCmd, HELP_EXAMPLES[type]);
  }

  const configCmd = attachHelpExamples(
    program
    .command('config')
    .description('Gerencia a configuração do ambiente'),
    HELP_EXAMPLES.config
  );

  configCmd
    .command('init')
    .description('Configura o ambiente de forma interativa (cria bbuilder.config.json)')
    .action(() => runConfigInit(config, writableConfigPath));

  configCmd
    .command('show')
    .description('Exibe a configuração atual')
    .action(() => {
      console.log('');
      console.log(chalk.cyan('  Configuração Atual'));
      console.log(chalk.blue('  ──────────────────'));
      console.log(chalk.gray(`  Arquivo: ${resolvedConfigPath}`));
      console.log('');
      console.log(JSON.stringify(config, null, 2)
        .split('\n')
        .map(line => '  ' + line)
        .join('\n'));
      console.log('');
    });

  const configValidateCmd = configCmd
    .command('validate')
    .description('Valida a estrutura do arquivo de configuração')
    .action(() => runConfigValidate(resolvedConfigPath));

  attachHelpExamples(configValidateCmd, HELP_EXAMPLES.configValidate);

  const projectCmd = attachHelpExamples(
    program
    .command('project')
    .description('Gerencia a lista de projetos'),
    HELP_EXAMPLES.project
  );

  projectCmd
    .command('add')
    .description('Adiciona um novo projeto à lista')
    .action(() => runProjectAdd(config, writableConfigPath));

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

  attachHelpExamples(
    program
    .command('doctor')
    .description('Diagnostica configuração, paths e binários do ambiente')
    .action(() => runDoctor(config, resolvedConfigPath)),
    HELP_EXAMPLES.doctor
  );

  if (argv.length <= 2) {
    banner();
    const resolved = await promptBuild(config);
    await executeBuild(resolved);
    return;
  }

  await program.parseAsync(argv);
}
