import chalk from 'chalk';
import inquirer from 'inquirer';

import { buildDefaultDependencyPaths, resolveLibTemplate, saveConfig } from '../config/config';
import { BuildOptions, BuildType, Config } from '../types';

/**
 * Resolve o projeto informado pelo usuário. Aceita tanto o NOME (chave em
 * config.projects, ex.: "BimerFaturamento") quanto o CAMINHO relativo
 * (ex.: "faturamento\\BimerFaturamento"). Se o valor casar com uma chave
 * conhecida, retorna o caminho correspondente; caso contrário, retorna o
 * próprio valor (permitindo caminhos arbitrários). Função pura para teste.
 */
export function resolveProjectInput(
  input: string,
  projects: Record<string, string>,
): string {
  return (input && projects[input]) || input;
}

/**
 * Indica se o processo está rodando em um terminal interativo. Quando falso
 * (ex.: pipe, CI, execução programática), não é possível abrir prompts do
 * inquirer — tentar fazê-lo quebra com ERR_USE_AFTER_CLOSE. Nesses casos o
 * CLI deve usar os valores default em vez de perguntar.
 */
export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

/**
 * Deriva as respostas default para perguntas do inquirer sem interação.
 * Usa a propriedade `default` de cada pergunta (ou a primeira escolha de uma
 * lista, como o inquirer faria). Função pura para permitir teste unitário.
 */
export function defaultAnswers(
  questions: Array<{ name: string; default?: unknown; choices?: Array<{ value: unknown }> }>,
): Record<string, unknown> {
  const answers: Record<string, unknown> = {};
  for (const q of questions) {
    if (q.default !== undefined) {
      answers[q.name] = q.default;
    } else if (q.choices && q.choices.length > 0) {
      answers[q.name] = q.choices[0].value;
    }
  }
  return answers;
}

export async function promptBuild(config: Config, cliType?: string, cliProject?: string, cliVersion?: string, showWarnings?: boolean, attach?: boolean): Promise<BuildOptions> {
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
      default: config.envVersion,
    });
  }

  // Em ambiente não-interativo (sem TTY), não é possível abrir prompts sem
  // quebrar (ERR_USE_AFTER_CLOSE). Nesse caso aplica os defaults das perguntas
  // pendentes; havendo TTY, pergunta normalmente ao usuário.
  const answers = questions.length === 0
    ? {}
    : isInteractive()
      ? await inquirer.prompt(questions as any)
      : defaultAnswers(questions as any);

  // O --project pode vir como o NOME (chave em config.projects) ou como o
  // CAMINHO relativo (ex.: faturamento\BimerFaturamento). Se casar com uma
  // chave conhecida, resolve para o caminho; caso contrário usa como veio.
  // Isso alinha o comportamento do CLI com o do modo interativo (que já usa
  // o caminho como valor da escolha).
  const rawProject = cliProject || answers.project;
  const resolvedProject = resolveProjectInput(rawProject, config.projects);

  return {
    type: (cliType || answers.type) as BuildType,
    project: resolvedProject,
    version: cliVersion || answers.version || '',
    repoBase: config.repoBase,
    delphiDir: config.delphiDir,
    envVersion: config.envVersion,
    libRoot: config.libRoot,
    libExternos: config.libExternos,
    libErp: config.libErp,
    libAlterdata: config.libAlterdata,
    dependencyPaths: config.dependencyPaths,
    exeOutputDir: config.exeOutputDir,
    dcuOutputDir: config.dcuOutputDir,
    showWarnings: showWarnings ?? false,
    attach: attach ?? false,
    stacktraceReportDir: config.stacktraceReportDir,
  };
}

export async function runConfigInit(config: Config, configPath: string): Promise<void> {
  console.log('');
  console.log(chalk.cyan('  Configuração Interativa do Ambiente'));
  console.log(chalk.blue('  ────────────────────────────────────'));

  const answers = await inquirer.prompt([
    { type: 'input', name: 'repoBase', message: 'Raiz do repositório:', default: config.repoBase },
    { type: 'input', name: 'delphiDir', message: 'Diretório do Delphi:', default: config.delphiDir },
    { type: 'input', name: 'envVersion', message: 'Versão do ambiente (ENV):', default: config.envVersion },
    { type: 'input', name: 'libRoot', message: 'LibraryDelphiAlexandria root:', default: config.libRoot },
  ] as any);

  const libRoot = answers.libRoot || 'C:\\LibraryDelphiAlexandria';
  const libExternosTemplate = answers.libExternos || '${libRoot}\\Externos\\3.00';
  const libErpTemplate = answers.libErp || '${libRoot}\\ERP\\${envVersion}';
  const libAlterdataTemplate = answers.libAlterdata || '${libRoot}\\LibAlterdata\\1.0.0';
  const exeOutputDir = answers.exeOutputDir || 'C:\\Temp\\${envVersion}\\EXE';
  const dcuOutputDir = answers.dcuOutputDir || 'C:\\Temp\\${envVersion}\\DCU';
  const newConfig: Config = {
    ...config,
    ...answers,
    libRoot,
    libExternos: libExternosTemplate,
    libErp: libErpTemplate,
    libAlterdata: libAlterdataTemplate,
    exeOutputDir,
    dcuOutputDir,
    dependencyPaths: buildDefaultDependencyPaths({
      repoBase: answers.repoBase,
      delphiDir: answers.delphiDir,
      libExternos: resolveLibTemplate(libExternosTemplate, libRoot),
      libErp: resolveLibTemplate(libErpTemplate, libRoot, answers.envVersion),
      libAlterdata: resolveLibTemplate(libAlterdataTemplate, libRoot),
    }),
  };

  saveConfig(newConfig, configPath);
  console.log('');
  console.log(chalk.green('  ✔ bbuilder.config.json salvo com sucesso!'));
  console.log(chalk.gray(`    ${configPath}`));
  console.log('');
}

export async function runProjectAdd(config: Config, configPath: string): Promise<void> {
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

  saveConfig(nextConfig, configPath);
  console.log(chalk.green(`\n  ✔ Projeto "${projectName}" adicionado!\n`));
}

export async function runProjectRemove(config: Config, configPath: string, cliProjectName?: string): Promise<void> {
  const projectEntries = Object.entries(config.projects);

  if (projectEntries.length === 0) {
    console.log(chalk.yellow('\n  Não há projetos cadastrados para remover.\n'));
    return;
  }

  let projectName = cliProjectName;

  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectName',
        message: 'Qual projeto deseja remover?',
        choices: projectEntries.map(([name, projectPath]) => ({
          name: `${name} (${projectPath})`,
          value: name,
        })),
      },
    ] as any);

    projectName = answers.projectName;
  }

  if (!projectName || !config.projects[projectName]) {
    console.log(chalk.yellow(`\n  Projeto "${projectName || ''}" não encontrado.\n`));
    return;
  }

  const nextProjects = { ...config.projects };
  delete nextProjects[projectName];

  const nextConfig: Config = {
    ...config,
    projects: nextProjects,
  };

  saveConfig(nextConfig, configPath);
  console.log(chalk.green(`\n  ✔ Projeto "${projectName}" removido!\n`));
}
