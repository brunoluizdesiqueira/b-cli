import execa from 'execa';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { BuildOptions, BuildType } from '../types';
import { fatal, step } from '../ui/output';

export function buildCompilerFlags(buildType: BuildType): { flags: string[]; defines: string; runAfter: boolean } {
  const baseDefines = 'DEBUG;ALT_CEF133_0;EUREKALOG';
  const releaseDefines = 'RELEASE;ALT_CEF133_0;EUREKALOG';

  switch (buildType) {
    case 'FAST':
      return {
        flags: ['-$W+', '-$J+', '-$D+', '-$L+', '-$Y+', '-$O-'],
        defines: baseDefines,
        runAfter: true,
      };
    case 'DEBUG':
      return {
        flags: ['-B', '-$W+', '-$J+', '-$D+', '-$L+', '-$Y+', '-$O-', '-V', '-VR'],
        defines: baseDefines,
        runAfter: true,
      };
    case 'RELEASE':
      return {
        flags: ['-B', '-$W+', '-$J+', '-$D0', '-$L-', '-$Y-', '-$O+'],
        defines: releaseDefines,
        runAfter: false,
      };
  }
}

function buildDependencies(opts: BuildOptions): string {
  return opts.dependencyPaths.map(p => `"${p}"`).join(';');
}

export async function runCgrc(opts: BuildOptions, projectName: string): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `BimerBuild_${projectName}`);
  const vrcFile = path.join(tempDir, `${projectName}.vrc`);
  const resFile = path.join(tempDir, `${projectName}.res`);

  step('Compilando recursos e embutindo ícone...');

  try {
    await execa(
      path.win32.join(opts.delphiDir, 'bin', 'cgrc.exe'),
      [vrcFile, `-fo${resFile}`],
      { stdio: 'inherit' }
    );
  } catch {
    fatal('Falha do compilador CGRC ao gerar o arquivo de recursos .res.');
  }

  return resFile;
}

export async function runDcc64(opts: BuildOptions, projectName: string, workspaceDir: string): Promise<void> {
  const { flags, defines } = buildCompilerFlags(opts.type);
  const deps = buildDependencies(opts);
  const exeOut = path.win32.join('C:\\Temp', opts.envVersion, 'EXE');
  const dcuOut = path.win32.join('C:\\Temp', opts.envVersion, 'DCU');

  if (!fs.existsSync(exeOut)) fs.mkdirSync(exeOut, { recursive: true });
  if (!fs.existsSync(dcuOut)) fs.mkdirSync(dcuOut, { recursive: true });

  step(`Iniciando compilação do código fonte (${opts.type})...`);

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

  try {
    await execa(dcc64, args, {
      cwd: workspaceDir,
      stdio: 'inherit',
    });
  } catch {
    fatal('Falha na compilação do Delphi. Verifique os logs de erro acima.');
  }
}

export function runBuiltExecutable(opts: BuildOptions, projectName: string): void {
  const { runAfter } = buildCompilerFlags(opts.type);

  if (!runAfter) return;

  const exeOut = path.win32.join('C:\\Temp', opts.envVersion, 'EXE', `${projectName}.exe`);
  step(`Iniciando ${projectName}.exe...`);
  execa(exeOut, [], { detached: true, stdio: 'ignore' }).unref();
}
