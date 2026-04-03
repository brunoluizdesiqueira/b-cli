export type BuildType = 'FAST' | 'DEBUG' | 'RELEASE';

export interface BuildOptions {
  type: BuildType;
  project: string;
  version: string;
  repoBase: string;
  delphiDir: string;
  envVersion: string;
  libRoot: string;
  libErp: string;
  libAlterdata: string;
  dependencyPaths: string[];
}

export interface Config {
  repoBase: string;
  delphiDir: string;
  envVersion: string;
  libRoot: string;
  libErp: string;
  libAlterdata: string;
  dependencyPaths: string[];
  projects: Record<string, string>;
}
