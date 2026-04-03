import chalk from 'chalk';
import * as fs from 'fs';

import { Config } from '../types';

interface ValidationIssue {
  field: string;
  message: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateProjects(projects: unknown): ValidationIssue[] {
  if (!projects || typeof projects !== 'object' || Array.isArray(projects)) {
    return [{ field: 'projects', message: 'deve ser um objeto no formato nome => caminho' }];
  }

  const entries = Object.entries(projects as Record<string, unknown>);
  if (entries.length === 0) {
    return [{ field: 'projects', message: 'deve conter ao menos um projeto configurado' }];
  }

  const issues: ValidationIssue[] = [];
  for (const [name, projectPath] of entries) {
    if (!isNonEmptyString(name)) {
      issues.push({ field: 'projects', message: 'contém uma chave de projeto inválida' });
    }
    if (!isNonEmptyString(projectPath)) {
      issues.push({ field: `projects.${name}`, message: 'deve apontar para um caminho não vazio' });
    }
  }

  return issues;
}

export function validateConfigObject(raw: unknown): ValidationIssue[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return [{ field: 'config', message: 'o arquivo deve conter um objeto JSON válido' }];
  }

  const config = raw as Partial<Config>;
  const issues: ValidationIssue[] = [];

  const requiredStringFields: Array<keyof Pick<Config, 'repoBase' | 'delphiDir' | 'envVersion' | 'libRoot' | 'libErp' | 'libAlterdata'>> = [
    'repoBase',
    'delphiDir',
    'envVersion',
    'libRoot',
    'libErp',
    'libAlterdata',
  ];

  for (const field of requiredStringFields) {
    if (!isNonEmptyString(config[field])) {
      issues.push({ field, message: 'deve ser uma string não vazia' });
    }
  }

  if (!Array.isArray(config.dependencyPaths) || config.dependencyPaths.length === 0) {
    issues.push({ field: 'dependencyPaths', message: 'deve ser um array com ao menos um path' });
  } else {
    config.dependencyPaths.forEach((depPath, index) => {
      if (!isNonEmptyString(depPath)) {
        issues.push({ field: `dependencyPaths[${index}]`, message: 'deve ser uma string não vazia' });
      }
    });
  }

  issues.push(...validateProjects(config.projects));

  return issues;
}

export function runConfigValidate(configPath: string): void {
  console.log('');
  console.log(chalk.cyan('  Validação da Configuração'));
  console.log(chalk.blue('  ─────────────────────────'));
  console.log(chalk.gray(`  Arquivo: ${configPath}`));
  console.log('');

  if (!fs.existsSync(configPath)) {
    console.log(chalk.red('  FAIL   Arquivo de configuração não encontrado.'));
    console.log('');
    process.exitCode = 1;
    return;
  }

  let rawText: string;
  try {
    rawText = fs.readFileSync(configPath, 'utf-8');
  } catch (error) {
    console.log(chalk.red(`  FAIL   Não foi possível ler o arquivo: ${error instanceof Error ? error.message : String(error)}`));
    console.log('');
    process.exitCode = 1;
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    console.log(chalk.red(`  FAIL   JSON inválido: ${error instanceof Error ? error.message : String(error)}`));
    console.log('');
    process.exitCode = 1;
    return;
  }

  const issues = validateConfigObject(parsed);
  if (issues.length === 0) {
    console.log(chalk.green('  OK     Estrutura da configuração está válida.'));
    console.log('');
    return;
  }

  issues.forEach(issue => {
    console.log(chalk.red(`  FAIL   ${issue.field}: ${issue.message}`));
  });
  console.log('');
  process.exitCode = 1;
}
