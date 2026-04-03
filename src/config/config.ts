import * as fs from 'fs';
import * as path from 'path';

import { Config } from '../types';

export const CONFIG_FILE = path.join(process.cwd(), 'bimer.config.json');

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

export function loadConfig(): Config {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
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

export function saveConfig(config: Config): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}
