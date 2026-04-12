import { describe, it } from 'node:test';
import assert from 'node:assert';

function win32Join(...segments: string[]): string {
  return segments.join('\\');
}

function resolveEnvTemplate(template: string, envVersion: string, libRoot?: string): string {
  let result = template
    .replace(/\$\{envVersion\}/g, envVersion)
    .replace(/\$envVersion/g, envVersion);
  
  if (libRoot) {
    result = result
      .replace(/\$\{libRoot\}/g, libRoot)
      .replace(/\$libRoot/g, libRoot);
  }
  
  return result;
}

function buildCompilerFlags(type: 'FAST' | 'DEBUG' | 'RELEASE') {
  const baseDefines = 'DEBUG;ALT_CEF133_0;EUREKALOG';
  const releaseDefines = 'RELEASE;ALT_CEF133_0;EUREKALOG';

  switch (type) {
    case 'FAST':
      return { flags: ['-$W+', '-$J+', '-$D+', '-$L+', '-$Y+', '-$O-'], defines: baseDefines };
    case 'DEBUG':
      return { flags: ['-B', '-$W+', '-$J+', '-$D+', '-$L+', '-$Y+', '-$O-', '-V', '-VR'], defines: baseDefines };
    case 'RELEASE':
      return { flags: ['-B', '-$W+', '-$J+', '-$D0', '-$L-', '-$Y-', '-$O+'], defines: releaseDefines };
  }
}

function buildDependencies(dependencyPaths: string[]) {
  return dependencyPaths.join(';');
}

interface BuildOptions {
  type: 'FAST' | 'DEBUG' | 'RELEASE';
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
}

function generateDcc64Command(opts: BuildOptions, projectName: string): { exe: string; args: string[] } {
  const { flags, defines } = buildCompilerFlags(opts.type);
  const deps = buildDependencies(opts.dependencyPaths);
  const exeOut = resolveEnvTemplate(opts.exeOutputDir, opts.envVersion);
  const dcuOut = resolveEnvTemplate(opts.dcuOutputDir, opts.envVersion);

  const nsValue = 'Data.Win;Datasnap.Win;Web.Win;Soap.Win;Xml.Win;Vcl;Vcl.Imaging;Vcl.Touch;Vcl.Samples;Vcl.Shell;System;Xml;Data;Datasnap.Web;Soap;Winapi;FireDAC.VCLUI;System.Win;';
  const aliasValue = 'Generics.Collections=System.Generics.Collections;Generics.Defaults=System.Generics.Defaults;WinTypes=Winapi.Windows;WinProcs=Winapi.Windows;DbiTypes=BDE;DbiProcs=BDE;DbiErrs=BDE';
  const dcc64 = win32Join(opts.delphiDir, 'bin', 'dcc64.exe');
  
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

  return { exe: dcc64, args };
}

function generateExePath(opts: BuildOptions, projectName: string): string {
  const exeOut = resolveEnvTemplate(opts.exeOutputDir, opts.envVersion);
  return win32Join(exeOut, `${projectName}.exe`);
}

describe('dcc64 command generation - FAST build', () => {
  const opts: BuildOptions = {
    type: 'FAST',
    project: 'BimerFaturamento',
    version: '11.3.0',
    repoBase: 'C:\\git\\bimer',
    delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
    envVersion: '11.03.00',
    libRoot: 'C:\\LibraryDelphiAlexandria',
    libExternos: 'C:\\LibraryDelphiAlexandria\\Externos\\3.00',
    libErp: 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00',
    libAlterdata: 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0',
    dependencyPaths: [
      'C:\\git\\bimer\\dependencies',
      'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\lib\\Win64\\release',
      'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\sgcWebSockets\\Win64',
      'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\DevExpress\\Win64',
      'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\dataset-serialize\\Win64',
      'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\UniDAC\\Win64',
      'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00\\Win64',
      'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\EurekaLog\\Common',
      'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\EurekaLog\\Win64',
      'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\ZipForge\\Win64',
      'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0\\feedbacker',
      'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0\\rest-client',
    ],
    exeOutputDir: 'C:\\Temp\\${envVersion}\\EXE',
    dcuOutputDir: 'C:\\Temp\\${envVersion}\\DCU',
  };

  it('deve gerar comando dcc64 com exe output correto', () => {
    const { exe, args } = generateDcc64Command(opts, 'BimerFaturamento');
    
    const eIndex = args.findIndex(a => a.startsWith('-E'));
    assert.ok(eIndex >= 0, 'deve ter -E flag');
    assert.strictEqual(args[eIndex], '-EC:\\Temp\\11.03.00\\EXE');
  });

  it('deve gerar comando dcc64 com dcu output correto', () => {
    const { args } = generateDcc64Command(opts, 'BimerFaturamento');
    
    const nuIndex = args.findIndex(a => a.startsWith('-NU'));
    assert.ok(nuIndex >= 0, 'deve ter -NU flag');
    assert.strictEqual(args[nuIndex], '-NUC:\\Temp\\11.03.00\\DCU');
  });

  it('deve gerar comando dcc64 com as flags de FAST', () => {
    const { args } = generateDcc64Command(opts, 'BimerFaturamento');
    
    assert.ok(args.includes('-$W+'));
    assert.ok(args.includes('-$J+'));
    assert.ok(args.includes('-$D+'));
    assert.ok(args.includes('-$L+'));
    assert.ok(args.includes('-$Y+'));
    assert.ok(args.includes('-$O-'));
  });

  it('deve gerar defines corretas para FAST', () => {
    const { args } = generateDcc64Command(opts, 'BimerFaturamento');
    
    const dIndex = args.findIndex(a => a.startsWith('-D'));
    assert.strictEqual(args[dIndex], '-DDEBUG;ALT_CEF133_0;EUREKALOG');
  });

  it('deve gerar exe path correto para execução após build', () => {
    const exePath = generateExePath(opts, 'BimerFaturamento');
    
    assert.strictEqual(exePath, 'C:\\Temp\\11.03.00\\EXE\\BimerFaturamento.exe');
  });

  it('deve incluir todos os dependency paths', () => {
    const { args } = generateDcc64Command(opts, 'BimerFaturamento');
    
    const iIndex = args.findIndex(a => a.startsWith('-I'));
    assert.ok(args[iIndex].includes('C:\\git\\bimer\\dependencies'));
    assert.ok(args[iIndex].includes('C:\\LibraryDelphiAlexandria\\Externos\\3.00'));
  });
});

describe('dcc64 command generation - DEBUG build', () => {
  const opts: BuildOptions = {
    type: 'DEBUG',
    project: 'Bimer',
    version: '11.3.0',
    repoBase: 'C:\\git\\bimer',
    delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
    envVersion: '11.03.00',
    libRoot: 'C:\\LibraryDelphiAlexandria',
    libExternos: 'C:\\LibraryDelphiAlexandria\\Externos\\3.00',
    libErp: 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00',
    libAlterdata: 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0',
    dependencyPaths: [],
    exeOutputDir: 'C:\\Temp\\${envVersion}\\EXE',
    dcuOutputDir: 'C:\\Temp\\${envVersion}\\DCU',
  };

  it('deve gerar flags de debug incluindo -B e -V', () => {
    const { args } = generateDcc64Command(opts, 'Bimer');
    
    assert.ok(args.includes('-B'));
    assert.ok(args.includes('-V'));
    assert.ok(args.includes('-VR'));
  });

  it('deve gerar exe path correto', () => {
    const exePath = generateExePath(opts, 'Bimer');
    
    assert.strictEqual(exePath, 'C:\\Temp\\11.03.00\\EXE\\Bimer.exe');
  });
});

describe('dcc64 command generation - RELEASE build', () => {
  const opts: BuildOptions = {
    type: 'RELEASE',
    project: 'LiberadorEstoque',
    version: '11.3.0',
    repoBase: 'C:\\git\\bimer',
    delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
    envVersion: '11.03.00',
    libRoot: 'C:\\LibraryDelphiAlexandria',
    libExternos: 'C:\\LibraryDelphiAlexandria\\Externos\\3.00',
    libErp: 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00',
    libAlterdata: 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0',
    dependencyPaths: [],
    exeOutputDir: 'C:\\Temp\\${envVersion}\\EXE',
    dcuOutputDir: 'C:\\Temp\\${envVersion}\\DCU',
  };

  it('deve gerar defines de RELEASE', () => {
    const { args } = generateDcc64Command(opts, 'LiberadorEstoque');
    
    const dIndex = args.findIndex(a => a.startsWith('-D'));
    assert.strictEqual(args[dIndex], '-DRELEASE;ALT_CEF133_0;EUREKALOG');
  });

  it('deve gerar flags otimizadas para release', () => {
    const { args } = generateDcc64Command(opts, 'LiberadorEstoque');
    
    assert.ok(args.includes('-B'));
    assert.ok(args.includes('-$D0'));
    assert.ok(args.includes('-$L-'));
    assert.ok(args.includes('-$Y-'));
    assert.ok(args.includes('-$O+'));
  });
});

describe('custom output paths', () => {
  it('deve gerar paths corretos com output customizado', () => {
    const opts: BuildOptions = {
      type: 'FAST',
      project: 'TestProject',
      version: '1.0.0',
      repoBase: 'C:\\git\\repo',
      delphiDir: 'C:\\Delphi',
      envVersion: '10.05.00',
      libRoot: 'C:\\Lib',
      libExternos: 'C:\\Lib\\Externos\\3.00',
      libErp: 'C:\\Lib\\ERP\\10.05.00',
      libAlterdata: 'C:\\Lib\\LibAlterdata\\1.0.0',
      dependencyPaths: [],
      exeOutputDir: 'D:\\Build\\${envVersion}\\Bin',
      dcuOutputDir: 'D:\\Build\\${envVersion}\\DCU',
    };

    const { args } = generateDcc64Command(opts, 'TestProject');
    
    const eIndex = args.findIndex(a => a.startsWith('-E'));
    assert.strictEqual(args[eIndex], '-ED:\\Build\\10.05.00\\Bin');
    
    const nuIndex = args.findIndex(a => a.startsWith('-NU'));
    assert.strictEqual(args[nuIndex], '-NUD:\\Build\\10.05.00\\DCU');
  });

  it('deve gerar exe path com output customizado', () => {
    const opts: BuildOptions = {
      type: 'FAST',
      project: 'TestProject',
      version: '1.0.0',
      repoBase: 'C:\\git\\repo',
      delphiDir: 'C:\\Delphi',
      envVersion: '10.05.00',
      libRoot: 'C:\\Lib',
      libExternos: 'C:\\Lib\\Externos\\3.00',
      libErp: 'C:\\Lib\\ERP\\10.05.00',
      libAlterdata: 'C:\\Lib\\LibAlterdata\\1.0.0',
      dependencyPaths: [],
      exeOutputDir: 'D:\\Build\\${envVersion}\\Bin',
      dcuOutputDir: 'D:\\Build\\${envVersion}\\DCU',
    };

    const exePath = generateExePath(opts, 'TestProject');
    
    assert.strictEqual(exePath, 'D:\\Build\\10.05.00\\Bin\\TestProject.exe');
  });
});

describe('backward compatibility com versão anterior', () => {
  it('exe output deve ser igual ao código original em produção', () => {
    const exeOutputDir = 'C:\\Temp\\${envVersion}\\EXE';
    const envVersion = '11.03.00';
    
    const exeOut = resolveEnvTemplate(exeOutputDir, envVersion);
    const expectedPath = 'C:\\Temp\\11.03.00\\EXE';
    
    assert.strictEqual(exeOut, expectedPath);
  });

  it('dcu output deve ser igual ao código original em produção', () => {
    const dcuOutputDir = 'C:\\Temp\\${envVersion}\\DCU';
    const envVersion = '11.03.00';
    
    const dcuOut = resolveEnvTemplate(dcuOutputDir, envVersion);
    const expectedPath = 'C:\\Temp\\11.03.00\\DCU';
    
    assert.strictEqual(dcuOut, expectedPath);
  });

  it('exe final path deve ser igual ao código original', () => {
    const exeOutputDir = 'C:\\Temp\\${envVersion}\\EXE';
    const envVersion = '11.03.00';
    const projectName = 'BimerFaturamento';
    
    const exeOut = resolveEnvTemplate(exeOutputDir, envVersion);
    const fullPath = win32Join(exeOut, `${projectName}.exe`);
    const expectedFullPath = 'C:\\Temp\\11.03.00\\EXE\\BimerFaturamento.exe';
    
    assert.strictEqual(fullPath, expectedFullPath);
  });
});