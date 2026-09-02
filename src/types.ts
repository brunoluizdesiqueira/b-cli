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
  /**
   * Quando true, o executável gerado é iniciado ANEXADO ao terminal
   * (stdout/stderr herdados), permitindo ver logs e stacktrace no console.
   * O terminal fica ocupado até o app encerrar. Só tem efeito nos modos
   * que executam o app após o build (FAST/DEBUG).
   */
  attach?: boolean;
  /**
   * Diretório onde a aplicação Delphi grava relatórios de crash/stacktrace
   * (ex.: bug reports .el do EurekaLog). Opcional e genérico. Quando definido
   * e usado com --attach, o CLI imprime no terminal o relatório mais recente
   * gerado após o início do app. Suporta os templates ${userProfile} e
   * ${envVersion}.
   */
  stacktraceReportDir?: string;
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
  /**
   * Diretório opcional onde a aplicação grava relatórios de crash/stacktrace.
   * Suporta templates ${userProfile} e ${envVersion}. Se ausente, o recurso
   * de impressão de stacktrace no --attach fica desabilitado.
   */
  stacktraceReportDir?: string;
}
