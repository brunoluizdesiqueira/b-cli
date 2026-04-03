import chalk from 'chalk';
import inquirer from 'inquirer';

import { buildDefaultDependencyPaths, CONFIG_FILE, saveConfig } from '../config/config';
import { BuildOptions, BuildType, Config } from '../types';

export async function promptBuild(config: Config, cliType?: string, cliProject?: string, cliVersion?: string): Promise<BuildOptions> {
  const questions: inquirer.QuestionCollection[] = [];
  const projectChoices = Object.entries(config.projects).map(([name, projectPath]) => ({
    name,
    value: projectPath,
  }));

  if (!cliType) {
    questions.push({
      type: 'list',
      name: 'type',
      message: 'Modo de build:',
      choices: [
        { name: '⚡ FAST    — Rápido, sem full rebuild, abre o sistema', value: 'FAST' },
        { name: '🔍 DEBUG   — Com símbolos de debug, abre o sistema', value: 'DEBUG' },
        { name: '🚀 RELEASE — Otimizado, não abre o sistema', value: 'RELEASE' },
      ],
      default: 'DEBUG',
    });
  }

  if (!cliProject) {
    questions.push({
      type: 'list',
      name: 'project',
      message: 'Qual projeto compilar?',
      choices: projectChoices,
      default: projectChoices[0]?.value,
    });
  }

  if (!cliVersion) {
    questions.push({
      type: 'input',
      name: 'version',
      message: 'Versão do EXE? (deixe em branco para manter atual):',
      default: '',
    });
  }

  const answers = await inquirer.prompt(questions as any);

  return {
    type: (cliType || answers.type) as BuildType,
    project: cliProject || answers.project,
    version: cliVersion || answers.version || '',
    repoBase: config.repoBase,
    delphiDir: config.delphiDir,
    envVersion: config.envVersion,
    libRoot: config.libRoot,
    libErp: config.libErp,
    libAlterdata: config.libAlterdata,
    dependencyPaths: config.dependencyPaths,
  };
}

export async function runConfigInit(config: Config): Promise<void> {
  console.log('');
  console.log(chalk.cyan('  Configuração Interativa do Ambiente'));
  console.log(chalk.blue('  ────────────────────────────────────'));

  const answers = await inquirer.prompt([
    { type: 'input', name: 'repoBase', message: 'Raiz do repositório:', default: config.repoBase },
    { type: 'input', name: 'delphiDir', message: 'Diretório do Delphi:', default: config.delphiDir },
    { type: 'input', name: 'envVersion', message: 'Versão do ambiente (ENV):', default: config.envVersion },
    { type: 'input', name: 'libRoot', message: 'LibraryDelphiAlexandria root:', default: config.libRoot },
  ] as any);

  const libErp = `C:\\LibraryDelphiAlexandria\\ERP\\${answers.envVersion}`;
  const newConfig: Config = {
    ...config,
    ...answers,
    libErp,
    libAlterdata: config.libAlterdata,
    dependencyPaths: buildDefaultDependencyPaths({
      repoBase: answers.repoBase,
      delphiDir: answers.delphiDir,
      libRoot: answers.libRoot,
      libErp,
      libAlterdata: config.libAlterdata,
    }),
  };

  saveConfig(newConfig);
  console.log('');
  console.log(chalk.green('  ✔ bimer.config.json salvo com sucesso!'));
  console.log(chalk.gray(`    ${CONFIG_FILE}`));
  console.log('');
}

export async function runProjectAdd(config: Config): Promise<void> {
  const { projectName, projectPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Nome do projeto (ex: BimerFaturamento):',
    },
    {
      type: 'input',
      name: 'projectPath',
      message: 'Caminho do projeto (ex: geral\\integrador\\IntegradorXPTO):',
    },
  ] as any);

  if (!projectName || !projectPath) return;

  if (config.projects[projectName]) {
    console.log(chalk.yellow('\n  Já existe um projeto com esse nome.\n'));
    return;
  }

  if (Object.values(config.projects).includes(projectPath)) {
    console.log(chalk.yellow('\n  Esse caminho de projeto já está cadastrado.\n'));
    return;
  }

  const nextConfig: Config = {
    ...config,
    projects: {
      ...config.projects,
      [projectName]: projectPath,
    },
  };

  saveConfig(nextConfig);
  console.log(chalk.green(`\n  ✔ Projeto "${projectName}" adicionado!\n`));
}
