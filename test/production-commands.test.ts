import { describe, it } from 'node:test';
import assert from 'node:assert';

function win32Join(...segments: string[]): string {
  return segments.join('\\');
}

function buildCompilerFlags(buildType: 'FAST' | 'DEBUG' | 'RELEASE') {
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

function buildDependencies(dependencyPaths: string[]): string {
  return dependencyPaths.join(';');
}

interface BuildOptions {
  type: 'FAST' | 'DEBUG' | 'RELEASE';
  envVersion: string;
  delphiDir: string;
  dependencyPaths: string[];
}

function getDcc64ProductionCommands(opts: BuildOptions, projectName: string) {
  const { flags, defines } = buildCompilerFlags(opts.type);
  const deps = buildDependencies(opts.dependencyPaths);
  const exeOut = win32Join('C:\\Temp', opts.envVersion, 'EXE');
  const dcuOut = win32Join('C:\\Temp', opts.envVersion, 'DCU');

  const nsValue = 'Data.Win;Datasnap.Win;Web.Win;Soap.Win;Xml.Win;Vcl;Vcl.Imaging;Vcl.Touch;Vcl.Samples;Vcl.Shell;System;Xml;Data;Datasnap;Web;Soap;Winapi;FireDAC.VCLUI;System.Win;';
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

function getExeProductionPath(opts: BuildOptions, projectName: string) {
  const exeOut = win32Join('C:\\Temp', opts.envVersion, 'EXE');
  return win32Join(exeOut, `${projectName}.exe`);
}

const PRODUCTION_DEPS = [
  'C:\\git\\bimer\\dependencies',
  'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\lib\\Win64\\release',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\sgcWebSockets\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\DevExpress\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\dataset-serialize\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\UniDAC\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\EurekaLog\\Common',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\EurekaLog\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\SMImport\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\SMExport\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\RXLibrary\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\ReportBuilder\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\ComPort\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\QuickReport\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\FastMM\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\Tee\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\ExtraDevices\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\ExtraFilter\\Win64',
  'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\ZipForge\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\FortesReport\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\TBGWebCharts\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\EventBus\\Win64',
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\Horse\\Win64',
  'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0\\feedbacker',
  'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0\\rest-client',
];

describe('PRODUCTION COMMANDS - FAST build', () => {
  const opts: BuildOptions = {
    type: 'FAST',
    envVersion: '11.03.00',
    delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
    dependencyPaths: PRODUCTION_DEPS,
  };

  it('EXE do dcc64 deve ser exatamente como em produção', () => {
    const { exe } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(exe, 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\bin\\dcc64.exe');
  });

  it('ARGS[0] deve ser -$W+ (FAST)', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[0], '-$W+');
  });

  it('ARGS[1] deve ser -$J+ (FAST)', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[1], '-$J+');
  });

  it('ARGS[12] deve ser -DDEBUG;ALT_CEF133_0;EUREKALOG', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[12], '-DDEBUG;ALT_CEF133_0;EUREKALOG');
  });

  it('ARGS[13] deve ser -EC:\\Temp\\11.03.00\\EXE', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[13], '-EC:\\Temp\\11.03.00\\EXE');
  });

  it('ARGS[17] deve ser -NUC:\\Temp\\11.03.00\\DCU', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[17], '-NUC:\\Temp\\11.03.00\\DCU');
  });

  it('ARGS[32] deve ser o projeto .dpr', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[32], 'BimerFaturamento.dpr');
  });

  it('exe path para execução pós-build deve ser C:\\Temp\\11.03.00\\EXE\\BimerFaturamento.exe', () => {
    const exePath = getExeProductionPath(opts, 'BimerFaturamento');
    assert.strictEqual(exePath, 'C:\\Temp\\11.03.00\\EXE\\BimerFaturamento.exe');
  });

  it('deve ter 33 argumentos', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args.length, 33);
  });

  it('dependency paths devem ter 26 itens', () => {
    assert.strictEqual(PRODUCTION_DEPS.length, 26);
  });
});

describe('PRODUCTION COMMANDS - DEBUG build', () => {
  const opts: BuildOptions = {
    type: 'DEBUG',
    envVersion: '11.03.00',
    delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
    dependencyPaths: PRODUCTION_DEPS,
  };

  it('ARGS[0] deve ser -B (DEBUG)', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[0], '-B');
  });

  it('ARGS[7] deve ser -V (DEBUG)', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[7], '-V');
  });

  it('ARGS[8] deve ser -VR (DEBUG)', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[8], '-VR');
  });

  it('ARGS[15] deve ser -DDEBUG;ALT_CEF133_0;EUREKALOG', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[15], '-DDEBUG;ALT_CEF133_0;EUREKALOG');
  });

  it('exe path para execução pós-build deve ser C:\\Temp\\11.03.00\\EXE\\BimerFaturamento.exe', () => {
    const exePath = getExeProductionPath(opts, 'BimerFaturamento');
    assert.strictEqual(exePath, 'C:\\Temp\\11.03.00\\EXE\\BimerFaturamento.exe');
  });

  it('deve ter 36 argumentos (DEBUG tem mais flags)', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args.length, 36);
  });
});

describe('PRODUCTION COMMANDS - RELEASE build', () => {
  const opts: BuildOptions = {
    type: 'RELEASE',
    envVersion: '11.03.00',
    delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
    dependencyPaths: PRODUCTION_DEPS,
  };

  it('ARGS[3] deve ser -$D0 (RELEASE)', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[3], '-$D0');
  });

  it('ARGS[5] deve ser -$Y- (RELEASE)', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[5], '-$Y-');
  });

  it('ARGS[13] deve ser -DRELEASE;ALT_CEF133_0;EUREKALOG', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args[13], '-DRELEASE;ALT_CEF133_0;EUREKALOG');
  });

  it('deve ter 34 argumentos (RELEASE não tem -V -VR)', () => {
    const { args } = getDcc64ProductionCommands(opts, 'BimerFaturamento');
    assert.strictEqual(args.length, 34);
  });

  it('exe path para RELEASE deve existir mas não é executado', () => {
    const exePath = getExeProductionPath(opts, 'BimerFaturamento');
    assert.strictEqual(exePath, 'C:\\Temp\\11.03.00\\EXE\\BimerFaturamento.exe');
  });
});

describe('PRODUCTION - outros projetos', () => {
  const opts: BuildOptions = {
    type: 'FAST',
    envVersion: '11.03.00',
    delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
    dependencyPaths: PRODUCTION_DEPS,
  };

  it('deve funcionar para projeto Bimer', () => {
    const { args } = getDcc64ProductionCommands(opts, 'Bimer');
    assert.strictEqual(args[args.length - 1], 'Bimer.dpr');
  });

  it('deve funcionar para projeto LiberadorEstoque', () => {
    const { args } = getDcc64ProductionCommands(opts, 'LiberadorEstoque');
    assert.strictEqual(args[args.length - 1], 'LiberadorEstoque.dpr');
  });

  it('exe path para Bimer', () => {
    const exePath = getExeProductionPath(opts, 'Bimer');
    assert.strictEqual(exePath, 'C:\\Temp\\11.03.00\\EXE\\Bimer.exe');
  });
});