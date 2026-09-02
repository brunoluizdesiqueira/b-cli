import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Config } from '../types';

export const CONFIG_FILENAME = 'bbuilder.config.json';
export const LEGACY_CONFIG_FILENAME = 'bimer.config.json';
export const CONFIG_ENV_VAR = 'BBUILDER_CONFIG';

export function resolveLibTemplate(template: string, libRoot: string, envVersion?: string): string {
  let result = template
    .replace(/\$\{libRoot\}/g, libRoot)
    .replace(/\$libRoot/g, libRoot);
  
  if (envVersion) {
    result = result
      .replace(/\$\{envVersion\}/g, envVersion)
      .replace(/\$envVersion/g, envVersion);
  }
  
  return result;
}

const DEFAULT_CONFIG_BASE = {
  repoBase: 'C:\\git\\bimer',
  delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
  envVersion: '11.03.00',
  libRoot: 'C:\\LibraryDelphiAlexandria',
  libExternos: '${libRoot}\\Externos\\3.00',
  libErp: '${libRoot}\\ERP\\${envVersion}',
  libAlterdata: '${libRoot}\\LibAlterdata\\1.0.0',
  exeOutputDir: 'C:\\Temp\\${envVersion}\\EXE',
  dcuOutputDir: 'C:\\Temp\\${envVersion}\\DCU',
  stacktraceReportDir: '${userProfile}\\EurekaLog',
};

export function buildDefaultDependencyPaths(params: Pick<Config, 'repoBase' | 'delphiDir' | 'libExternos' | 'libErp' | 'libAlterdata'>): string[] {
  const { repoBase, delphiDir, libExternos, libErp, libAlterdata } = params;

  return [
    `${repoBase}\\dependencies`,
    `${delphiDir}\\lib\\Win64\\release`,
    `${libExternos}\\sgcWebSockets\\Win64`,
    `${libExternos}\\DevExpress\\Win64`,
    `${libExternos}\\dataset-serialize\\Win64`,
    `${libExternos}\\UniDAC\\Win64`,
    `${libExternos}\\EurekaLog\\Common`,
    `${libExternos}\\EurekaLog\\Win64`,
    `${libExternos}\\SMImport\\Win64`,
    `${libExternos}\\SMExport\\Win64`,
    `${libExternos}\\RXLibrary\\Win64`,
    `${libExternos}\\ReportBuilder\\Win64`,
    `${libExternos}\\ComPort\\Win64`,
    `${libExternos}\\QuickReport\\Win64`,
    `${libExternos}\\FastMM\\Win64`,
    `${libExternos}\\Tee\\Win64`,
    `${libExternos}\\ExtraDevices\\Win64`,
    `${libExternos}\\ExtraFilter\\Win64`,
    `${libErp}\\Win64`,
    `${libExternos}\\ZipForge\\Win64`,
    `${libExternos}\\FortesReport\\Win64`,
    `${libExternos}\\TBGWebCharts\\Win64`,
    `${libExternos}\\EventBus\\Win64`,
    `${libExternos}\\Horse\\Win64`,
    `${libAlterdata}\\feedbacker`,
    `${libAlterdata}\\rest-client`,
  ];
}

export const DEFAULT_CONFIG: Config = {
  ...DEFAULT_CONFIG_BASE,
  libExternos: resolveLibTemplate(DEFAULT_CONFIG_BASE.libExternos, DEFAULT_CONFIG_BASE.libRoot),
  libErp: resolveLibTemplate(DEFAULT_CONFIG_BASE.libErp, DEFAULT_CONFIG_BASE.libRoot, DEFAULT_CONFIG_BASE.envVersion),
  libAlterdata: resolveLibTemplate(DEFAULT_CONFIG_BASE.libAlterdata, DEFAULT_CONFIG_BASE.libRoot),
  dependencyPaths: buildDefaultDependencyPaths({
    ...DEFAULT_CONFIG_BASE,
    libExternos: resolveLibTemplate(DEFAULT_CONFIG_BASE.libExternos, DEFAULT_CONFIG_BASE.libRoot),
    libErp: resolveLibTemplate(DEFAULT_CONFIG_BASE.libErp, DEFAULT_CONFIG_BASE.libRoot, DEFAULT_CONFIG_BASE.envVersion),
    libAlterdata: resolveLibTemplate(DEFAULT_CONFIG_BASE.libAlterdata, DEFAULT_CONFIG_BASE.libRoot),
  }),
  projects: {
    BimerFaturamento: 'faturamento\\BimerFaturamento',
    Bimer: 'Bimer',
    LiberadorEstoque: 'geral\\gerenteeletronico.jobs.liberadorestoque\\LiberadorEstoque',
    BimerEstoque: 'estoque\\BimerEstoque',
  },
  exeOutputDir: DEFAULT_CONFIG_BASE.exeOutputDir,
  dcuOutputDir: DEFAULT_CONFIG_BASE.dcuOutputDir,
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

      const libRoot = merged.libRoot || DEFAULT_CONFIG_BASE.libRoot;
      const envVersion = merged.envVersion || DEFAULT_CONFIG_BASE.envVersion;

      const isLegacyLibRoot = libRoot.endsWith('Externos\\3.00');

      if (isLegacyLibRoot) {
        merged.libRoot = libRoot.replace('\\Externos\\3.00', '');
        merged.libExternos = libRoot;
        merged.libErp = `${merged.libRoot}\\ERP\\${envVersion}`;
        merged.libAlterdata = `${merged.libRoot}\\LibAlterdata\\1.0.0`;
      } else {
        merged.libExternos = resolveLibTemplate(DEFAULT_CONFIG_BASE.libExternos, libRoot);
        merged.libErp = resolveLibTemplate(DEFAULT_CONFIG_BASE.libErp, libRoot, envVersion);
        merged.libAlterdata = resolveLibTemplate(DEFAULT_CONFIG_BASE.libAlterdata, libRoot);
      }

      if (!Array.isArray(parsed.dependencyPaths) || parsed.dependencyPaths.length === 0) {
        merged.dependencyPaths = buildDefaultDependencyPaths(merged);
      } else {
        merged.dependencyPaths = merged.dependencyPaths.map(
          (dep: string) => resolveLibTemplate(dep, libRoot, envVersion),
        );
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
