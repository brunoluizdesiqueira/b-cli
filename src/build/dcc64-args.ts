import * as path from 'path';

import { BuildOptions, BuildType } from '../types';

/**
 * Fonte única de verdade para a geração dos comandos do compilador dcc64.
 *
 * Tanto o executor real do build (compiler.ts) quanto a ferramenta de
 * inspeção de comandos (validate-commands.ts) consomem este módulo. Qualquer
 * alteração em flags, defines, namespaces, aliases ou ordem de argumentos deve
 * ser feita AQUI e em nenhum outro lugar, garantindo que "o que é inspecionado"
 * seja exatamente "o que é executado".
 */

export interface Dcc64Command {
  exe: string;
  args: string[];
  exeOutputDir: string;
  dcuOutputDir: string;
  projectName: string;
}

export interface ExeCommand {
  exe: string;
  projectName: string;
}

export interface CompilerFlags {
  flags: string[];
  defines: string;
  /** Se true, o executável deve ser iniciado após a compilação (FAST/DEBUG). */
  runAfter: boolean;
}

/** Namespaces (-NS) usados pelo dcc64. */
export const DCC64_NS_VALUE =
  'Data.Win;Datasnap.Win;Web.Win;Soap.Win;Xml.Win;Vcl;Vcl.Imaging;Vcl.Touch;Vcl.Samples;Vcl.Shell;System;Xml;Data;Datasnap;Web;Soap;Winapi;FireDAC.VCLUI;System.Win;';

/** Aliases de unidades (-A) usados pelo dcc64. */
export const DCC64_ALIAS_VALUE =
  'Generics.Collections=System.Generics.Collections;Generics.Defaults=System.Generics.Defaults;WinTypes=Winapi.Windows;WinProcs=Winapi.Windows;DbiTypes=BDE;DbiProcs=BDE;DbiErrs=BDE';

const BASE_DEFINES = 'DEBUG;ALT_CEF133_0;EUREKALOG';
const RELEASE_DEFINES = 'RELEASE;ALT_CEF133_0;EUREKALOG';

export function resolveEnvTemplate(template: string, envVersion: string): string {
  return template
    .replace(/\$\{envVersion\}/g, envVersion)
    .replace(/\$envVersion/g, envVersion);
}

export function buildCompilerFlags(buildType: BuildType): CompilerFlags {
  switch (buildType) {
    case 'FAST':
      return {
        flags: ['-$W+', '-$J+', '-$D+', '-$L+', '-$Y+', '-$O-'],
        defines: BASE_DEFINES,
        runAfter: true,
      };
    case 'DEBUG':
      return {
        flags: ['-B', '-$W+', '-$J+', '-$D+', '-$L+', '-$Y+', '-$O-', '-V', '-VR'],
        defines: BASE_DEFINES,
        runAfter: true,
      };
    case 'RELEASE':
      return {
        flags: ['-B', '-$W+', '-$J+', '-$D0', '-$L-', '-$Y-', '-$O+'],
        defines: RELEASE_DEFINES,
        runAfter: false,
      };
  }
}

export function buildDependencies(opts: Pick<BuildOptions, 'dependencyPaths'>): string {
  // execa passes each compiler switch as a single argv entry, so we should
  // not embed quotes inside the semicolon-separated list. Doing that can make
  // dcc64 fail to resolve paths such as the Delphi runtime library.
  return opts.dependencyPaths.join(';');
}

/**
 * Monta o comando completo do dcc64 (executável + argumentos) para o projeto.
 * A ordem dos argumentos é significativa e deve permanecer estável.
 */
export function getDcc64Command(opts: BuildOptions, projectName: string): Dcc64Command {
  const { flags, defines } = buildCompilerFlags(opts.type);
  const deps = buildDependencies(opts);
  const exeOut = resolveEnvTemplate(opts.exeOutputDir, opts.envVersion);
  const dcuOut = resolveEnvTemplate(opts.dcuOutputDir, opts.envVersion);
  const dcc64 = path.win32.join(opts.delphiDir, 'bin', 'dcc64.exe');

  const args = [
    ...flags,
    '--no-config', '-Q', '-H-', '-W-',
    '-TX.exe',
    `-A${DCC64_ALIAS_VALUE}`,
    `-D${defines}`,
    `-E${exeOut}`,
    `-I${deps}`,
    `-LE${exeOut}`,
    `-LN${exeOut}`,
    `-NU${dcuOut}`,
    `-NS${DCC64_NS_VALUE}`,
    `-O${deps}`,
    `-R${deps}`,
    `-U${deps}`,
    '-K00400000', '-GD',
    `-NB${exeOut}`,
    `-NH${exeOut}`,
    `-NO${dcuOut}`,
    '-W-', '-W-SYMBOL_PLATFORM', '-W-UNIT_PLATFORM', '-W-DUPLICATE_CTOR_DTOR', '-W-IMPLICIT_STRING_CAST',
    `${projectName}.dpr`,
  ];

  return { exe: dcc64, args, exeOutputDir: exeOut, dcuOutputDir: dcuOut, projectName };
}

/** Caminho do executável gerado, usado para execução pós-build. */
export function getBuiltExecutablePath(opts: BuildOptions, projectName: string): ExeCommand {
  const exeOut = resolveEnvTemplate(opts.exeOutputDir, opts.envVersion);
  return { exe: path.win32.join(exeOut, `${projectName}.exe`), projectName };
}
