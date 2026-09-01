export type BuildType = 'FAST' | 'DEBUG' | 'RELEASE';

export interface BuildOptions {
  type: BuildType;
  project: string;
  version: string;
  repoBase: string;
  delphiDir: string;
  envVersion: string;
  libRoot: string;
  libExternos: string;
  libErp: string;
  libAlterdata: string;
  dependencyPaths: string[];
  exeOutputDir: string;
  dcuOutputDir: string;
  /** Quando true, não suprime hints/warnings do compilador (remove -H- e -W-). */
  showWarnings?: boolean;
}

export interface Config {
  repoBase: string;
  delphiDir: string;
  envVersion: string;
  libRoot: string;
  libExternos: string;
  libErp: string;
  libAlterdata: string;
  dependencyPaths: string[];
  projects: Record<string, string>;
  exeOutputDir: string;
  dcuOutputDir: string;
}
