import * as path from 'path';

import { BuildOptions, BuildType } from '../types';

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

export function getDcc64Command(opts: BuildOptions, projectName: string): Dcc64Command {
  const { flags, defines } = buildCompilerFlags(opts.type);
  const deps = buildDependencies(opts);
  const exeOut = resolveEnvTemplate(opts.exeOutputDir, opts.envVersion);
  const dcuOut = resolveEnvTemplate(opts.dcuOutputDir, opts.envVersion);

  const nsValue = 'Data.Win;Datasnap.Win;Web.Win;Soap.Win;Xml.Win;Vcl;Vcl.Imaging;Vcl.Touch;Vcl.Samples;Vcl.Shell;System;Xml;Data;Datasnap;Web;Soap;Winapi;FireDAC.VCLUI;System.Win;';
  const aliasValue = 'Generics.Collections=System.Generics.Collections;Generics.Defaults=System.Generics.Defaults;WinTypes=Winapi.Windows;WinProcs=Winapi.Windows;DbiTypes=BDE;DbiProcs=BDE;DbiErrs=BDE';
  const dcc64 = path.win32.join(opts.delphiDir, 'bin', 'dcc64.exe');

  const args = [
    ...flags,
    '--no-config', '-Q', '-H-', '-W-',
    '-TX.exe',
    `-A${aliasValue}`,
    `-D${defines}`,
    `-E${exeOut}`,
    `-I${deps}`,
    `-LE${exeOut}`,
    `-LN${exeOut}`,
    `-NU${dcuOut}`,
    `-NS${nsValue}`,
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

export function getBuiltExecutablePath(opts: BuildOptions, projectName: string): ExeCommand {
  const exeOut = resolveEnvTemplate(opts.exeOutputDir, opts.envVersion);
  return { exe: path.win32.join(exeOut, `${projectName}.exe`), projectName };
}

export function printCommands(opts: BuildOptions, projectName: string): void {
  console.log('\n=== COMANDOS PARA TESTES ===\n');
  
  const dcc64 = getDcc64Command(opts, projectName);
  console.log('--- dcc64 (compilação) ---');
  console.log('EXE:', dcc64.exe);
  console.log('ARGS:');
  dcc64.args.forEach((arg, i) => console.log(`  ${i}: ${arg}`));
  
  console.log('\n--- exe (execução pós-build) ---');
  const exe = getBuiltExecutablePath(opts, projectName);
  console.log('EXE:', exe.exe);
  
  console.log('\n=== FIM COMANDOS ===\n');
}

function buildCompilerFlags(buildType: BuildType): { flags: string[]; defines: string } {
  const baseDefines = 'DEBUG;ALT_CEF133_0;EUREKALOG';
  const releaseDefines = 'RELEASE;ALT_CEF133_0;EUREKALOG';

  switch (buildType) {
    case 'FAST':
      return { flags: ['-$W+', '-$J+', '-$D+', '-$L+', '-$Y+', '-$O-'], defines: baseDefines };
    case 'DEBUG':
      return { flags: ['-B', '-$W+', '-$J+', '-$D+', '-$L+', '-$Y+', '-$O-', '-V', '-VR'], defines: baseDefines };
    case 'RELEASE':
      return { flags: ['-B', '-$W+', '-$J+', '-$D0', '-$L-', '-$Y-', '-$O+'], defines: releaseDefines };
  }
}

function buildDependencies(opts: BuildOptions): string {
  return opts.dependencyPaths.join(';');
}

function resolveEnvTemplate(template: string, envVersion: string): string {
  return template
    .replace(/\$\{envVersion\}/g, envVersion)
    .replace(/\$envVersion/g, envVersion);
}