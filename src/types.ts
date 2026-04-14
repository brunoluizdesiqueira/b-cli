export type BuildType = 'FAST' | 'DEBUG' | 'RELEASE';

export interface BuildOptions {
  type: BuildType;
  project: string;
  version: string;
  repoBase: string;
  delphiDir: string;
  envVersion: string;
  libRoot: string;
  libExternal: string;
  libErp: string;
  libCompany: string;
  dependencyPaths: string[];
  exeOutputDir: string;
  dcuOutputDir: string;
}

export interface Config {
  repoBase: string;
  delphiDir: string;
  envVersion: string;
  libRoot: string;
  libExternal: string;
  libErp: string;
  libCompany: string;
  dependencyPaths: string[];
  projects: Record<string, string>;
  exeOutputDir: string;
  dcuOutputDir: string;
}
