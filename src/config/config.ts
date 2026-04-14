import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Config } from '../types';

export const CONFIG_FILENAME = 'bbuilder.config.json';
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
  repoBase: 'C:\\git\\myProject',
  delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
  envVersion: '11.03.00',
  libRoot: 'C:\\Library',
  libExternal: '${libRoot}\\External\\3.00',
  libErp: '${libRoot}\\ERP\\${envVersion}',
  libCompany: '${libRoot}\\CompanyLibrary\\1.0.0',
  exeOutputDir: 'C:\\Temp\\${envVersion}\\EXE',
  dcuOutputDir: 'C:\\Temp\\${envVersion}\\DCU',
};

export function buildDefaultDependencyPaths(params: Pick<Config, 'repoBase' | 'delphiDir' | 'libExternal' | 'libErp' | 'libCompany'>): string[] {
  const { repoBase, delphiDir, libExternal, libErp, libCompany } = params;

  return [
    `${repoBase}\\dependencies`,
    `${delphiDir}\\lib\\Win64\\release`,
    `${libExternal}\\sgcWebSockets\\Win64`,
    `${libExternal}\\DevExpress\\Win64`,
    `${libExternal}\\dataset-serialize\\Win64`,
    `${libExternal}\\UniDAC\\Win64`,
    `${libExternal}\\EurekaLog\\Common`,
    `${libExternal}\\EurekaLog\\Win64`,
    `${libExternal}\\SMImport\\Win64`,
    `${libExternal}\\SMExport\\Win64`,
    `${libExternal}\\RXLibrary\\Win64`,
    `${libExternal}\\ReportBuilder\\Win64`,
    `${libExternal}\\ComPort\\Win64`,
    `${libExternal}\\QuickReport\\Win64`,
    `${libExternal}\\FastMM\\Win64`,
    `${libExternal}\\Tee\\Win64`,
    `${libExternal}\\ExtraDevices\\Win64`,
    `${libExternal}\\ExtraFilter\\Win64`,
    `${libErp}\\Win64`,
    `${libExternal}\\ZipForge\\Win64`,
    `${libExternal}\\FortesReport\\Win64`,
    `${libExternal}\\TBGWebCharts\\Win64`,
    `${libExternal}\\EventBus\\Win64`,
    `${libExternal}\\Horse\\Win64`,
    `${libCompany}\\feedbacker`,
    `${libCompany}\\rest-client`,
  ];
}

export const DEFAULT_CONFIG: Config = {
  ...DEFAULT_CONFIG_BASE,
  libExternal: resolveLibTemplate(DEFAULT_CONFIG_BASE.libExternal, DEFAULT_CONFIG_BASE.libRoot),
  libErp: resolveLibTemplate(DEFAULT_CONFIG_BASE.libErp, DEFAULT_CONFIG_BASE.libRoot, DEFAULT_CONFIG_BASE.envVersion),
  libCompany: resolveLibTemplate(DEFAULT_CONFIG_BASE.libCompany, DEFAULT_CONFIG_BASE.libRoot),
  dependencyPaths: buildDefaultDependencyPaths({
    ...DEFAULT_CONFIG_BASE,
    libExternal: resolveLibTemplate(DEFAULT_CONFIG_BASE.libExternal, DEFAULT_CONFIG_BASE.libRoot),
    libErp: resolveLibTemplate(DEFAULT_CONFIG_BASE.libErp, DEFAULT_CONFIG_BASE.libRoot, DEFAULT_CONFIG_BASE.envVersion),
    libCompany: resolveLibTemplate(DEFAULT_CONFIG_BASE.libCompany, DEFAULT_CONFIG_BASE.libRoot),
  }),
  projects: {
    MySubProject: 'sub_directory\\MySubProject',
    MyProject: 'MyProject',
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
        merged.libExternal = libRoot;
        merged.libErp = `${merged.libRoot}\\ERP\\${envVersion}`;
        merged.libCompany = `${merged.libRoot}\\LibAlterdata\\1.0.0`;
      } else {
        merged.libExternal = resolveLibTemplate(DEFAULT_CONFIG_BASE.libExternal, libRoot);
        merged.libErp = resolveLibTemplate(DEFAULT_CONFIG_BASE.libErp, libRoot, envVersion);
        merged.libCompany = resolveLibTemplate(DEFAULT_CONFIG_BASE.libCompany, libRoot);
      }

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
