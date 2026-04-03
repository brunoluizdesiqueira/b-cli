import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Config } from '../types';

export const CONFIG_FILENAME = 'bbuilder.config.json';
export const LEGACY_CONFIG_FILENAME = 'bimer.config.json';
export const CONFIG_ENV_VAR = 'BBUILDER_CONFIG';

const DEFAULT_CONFIG_BASE = {
  repoBase: 'C:\\git\\bimer',
  delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
  envVersion: '11.03.00',
  libRoot: 'C:\\LibraryDelphiAlexandria\\Externos\\3.00',
  libErp: 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00',
  libAlterdata: 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0',
};

export function buildDefaultDependencyPaths(params: Pick<Config, 'repoBase' | 'delphiDir' | 'libRoot' | 'libErp' | 'libAlterdata'>): string[] {
  const { repoBase, delphiDir, libRoot, libErp, libAlterdata } = params;

  return [
    `${repoBase}\\dependencies`,
    `${delphiDir}\\lib\\Win64\\release`,
    `${libRoot}\\sgcWebSockets\\Win64`,
    `${libRoot}\\DevExpress\\Win64`,
    `${libRoot}\\dataset-serialize\\Win64`,
    `${libRoot}\\UniDAC\\Win64`,
    `${libRoot}\\EurekaLog\\Common`,
    `${libRoot}\\EurekaLog\\Win64`,
    `${libRoot}\\SMImport\\Win64`,
    `${libRoot}\\SMExport\\Win64`,
    `${libRoot}\\RXLibrary\\Win64`,
    `${libRoot}\\ReportBuilder\\Win64`,
    `${libRoot}\\ComPort\\Win64`,
    `${libRoot}\\QuickReport\\Win64`,
    `${libRoot}\\FastMM\\Win64`,
    `${libRoot}\\Tee\\Win64`,
    `${libRoot}\\ExtraDevices\\Win64`,
    `${libRoot}\\ExtraFilter\\Win64`,
    `${libErp}\\Win64`,
    `${libRoot}\\ZipForge\\Win64`,
    `${libRoot}\\FortesReport\\Win64`,
    `${libRoot}\\TBGWebCharts\\Win64`,
    `${libRoot}\\EventBus\\Win64`,
    `${libRoot}\\Horse\\Win64`,
    `${libAlterdata}\\feedbacker`,
    `${libAlterdata}\\rest-client`,
  ];
}

export const DEFAULT_CONFIG: Config = {
  ...DEFAULT_CONFIG_BASE,
  dependencyPaths: buildDefaultDependencyPaths(DEFAULT_CONFIG_BASE),
  projects: {
    BimerFaturamento: 'faturamento\\BimerFaturamento',
    Bimer: 'Bimer',
    LiberadorEstoque: 'geral\\gerenteeletronico.jobs.liberadorestoque\\LiberadorEstoque',
    BimerEstoque: 'estoque\\BimerEstoque',
  },
};

function deriveProjectName(projectPath: string): string {
  const normalized = projectPath.replace(/[\\/]+$/, '');
  const segments = normalized.split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] || projectPath;
}

function normalizeProjects(projects: unknown): Record<string, string> {
  if (projects && typeof projects === 'object' && !Array.isArray(projects)) {
    return { ...(projects as Record<string, string>) };
  }

  if (Array.isArray(projects)) {
    return projects.reduce<Record<string, string>>((acc, projectPath) => {
      if (typeof projectPath === 'string' && projectPath.trim()) {
        acc[deriveProjectName(projectPath)] = projectPath;
      }
      return acc;
    }, {});
  }

  return { ...DEFAULT_CONFIG.projects };
}

function getUserConfigDirectory(): string {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'bbuilder-cli');
  }

  const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(xdgConfig, 'bbuilder-cli');
}

export function getDefaultConfigPath(): string {
  return path.join(getUserConfigDirectory(), CONFIG_FILENAME);
}

export function getWritableConfigPath(configPath: string): string {
  if (path.basename(configPath) === LEGACY_CONFIG_FILENAME) {
    return path.join(path.dirname(configPath), CONFIG_FILENAME);
  }

  return configPath;
}

export function resolveConfigPath(argv: string[] = process.argv): string {
  for (let index = 0; index < argv.length; index++) {
    const current = argv[index];

    if (current === '--config' || current === '-c') {
      const next = argv[index + 1];
      if (next) return path.resolve(next);
    }

    if (current.startsWith('--config=')) {
      return path.resolve(current.slice('--config='.length));
    }
  }

  const envPath = process.env[CONFIG_ENV_VAR];
  if (envPath) {
    return path.resolve(envPath);
  }

  const localConfig = path.join(process.cwd(), CONFIG_FILENAME);
  if (fs.existsSync(localConfig)) {
    return localConfig;
  }

  const legacyLocalConfig = path.join(process.cwd(), LEGACY_CONFIG_FILENAME);
  if (fs.existsSync(legacyLocalConfig)) {
    return legacyLocalConfig;
  }

  return getDefaultConfigPath();
}

export function loadConfig(configPath: string): Config {
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<Config>;
      const merged = {
        ...DEFAULT_CONFIG,
        ...parsed,
        projects: normalizeProjects(parsed.projects),
      };

      if (!Array.isArray(parsed.dependencyPaths) || parsed.dependencyPaths.length === 0) {
        merged.dependencyPaths = buildDefaultDependencyPaths(merged);
      }

      return merged;
    } catch {
      // ignora parse error, usa default
    }
  }

  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: Config, configPath: string): void {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
