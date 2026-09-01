import { describe, it } from 'node:test';
import assert from 'node:assert';

// IMPORTA O CÓDIGO DE PRODUÇÃO REAL (não uma cópia local).
// Este é o teste que trava a refatoração: se compiler.ts / validate-commands.ts
// divergirem da fonte única dcc64-args.ts, ou se os args mudarem de valor/ordem,
// esta suíte quebra.
import {
  buildCompilerFlags,
  buildDependencies,
  getBuiltExecutablePath,
  getDcc64Command,
  resolveEnvTemplate,
  DCC64_NS_VALUE,
  DCC64_ALIAS_VALUE,
} from '../src/build/dcc64-args';
import { BuildOptions, BuildType } from '../src/types';

function makeOpts(type: BuildType): BuildOptions {
  return {
    type,
    project: 'faturamento\\BimerFaturamento',
    version: '11.3.4',
    repoBase: 'c:\\git\\bimer-workspace\\bimer',
    delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
    envVersion: '11.03.04',
    libRoot: 'C:\\LibraryDelphiAlexandria',
    libExternos: 'C:\\LibraryDelphiAlexandria\\Externos\\3.00',
    libErp: 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.04',
    libAlterdata: 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0',
    dependencyPaths: [
      'c:\\git\\bimer-workspace\\bimer\\dependencies',
      'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\lib\\Win64\\release',
      'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\sgcWebSockets\\Win64',
      'C:\\LibraryDelphiAlexandria\\ERP\\11.03.04\\Win64',
      'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0\\feedbacker',
    ],
    exeOutputDir: 'C:\\Temp\\${envVersion}\\EXE',
    dcuOutputDir: 'C:\\Temp\\${envVersion}\\DCU',
  };
}

const EXPECTED_DEPS =
  'c:\\git\\bimer-workspace\\bimer\\dependencies;' +
  'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\lib\\Win64\\release;' +
  'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\sgcWebSockets\\Win64;' +
  'C:\\LibraryDelphiAlexandria\\ERP\\11.03.04\\Win64;' +
  'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0\\feedbacker';

// Snapshot dos args esperados capturado do código de produção ANTES da
// refatoração (tmp-baseline-args.json). Se qualquer valor ou ordem mudar,
// estes testes falham.
const EXPECTED_ARGS: Record<BuildType, string[]> = {
  FAST: [
    '-$W+', '-$J+', '-$D+', '-$L+', '-$Y+', '-$O-',
    '--no-config', '-Q', '-H-', '-W-',
    '-TX.exe',
    `-A${DCC64_ALIAS_VALUE}`,
    '-DDEBUG;ALT_CEF133_0;EUREKALOG',
    '-EC:\\Temp\\11.03.04\\EXE',
    `-I${EXPECTED_DEPS}`,
    '-LEC:\\Temp\\11.03.04\\EXE',
    '-LNC:\\Temp\\11.03.04\\EXE',
    '-NUC:\\Temp\\11.03.04\\DCU',
    `-NS${DCC64_NS_VALUE}`,
    `-O${EXPECTED_DEPS}`,
    `-R${EXPECTED_DEPS}`,
    `-U${EXPECTED_DEPS}`,
    '-K00400000', '-GD',
    '-NBC:\\Temp\\11.03.04\\EXE',
    '-NHC:\\Temp\\11.03.04\\EXE',
    '-NOC:\\Temp\\11.03.04\\DCU',
    '-W-', '-W-SYMBOL_PLATFORM', '-W-UNIT_PLATFORM', '-W-DUPLICATE_CTOR_DTOR', '-W-IMPLICIT_STRING_CAST',
    'BimerFaturamento.dpr',
  ],
  DEBUG: [
    '-B', '-$W+', '-$J+', '-$D+', '-$L+', '-$Y+', '-$O-', '-V', '-VR',
    '--no-config', '-Q', '-H-', '-W-',
    '-TX.exe',
    `-A${DCC64_ALIAS_VALUE}`,
    '-DDEBUG;ALT_CEF133_0;EUREKALOG',
    '-EC:\\Temp\\11.03.04\\EXE',
    `-I${EXPECTED_DEPS}`,
    '-LEC:\\Temp\\11.03.04\\EXE',
    '-LNC:\\Temp\\11.03.04\\EXE',
    '-NUC:\\Temp\\11.03.04\\DCU',
    `-NS${DCC64_NS_VALUE}`,
    `-O${EXPECTED_DEPS}`,
    `-R${EXPECTED_DEPS}`,
    `-U${EXPECTED_DEPS}`,
    '-K00400000', '-GD',
    '-NBC:\\Temp\\11.03.04\\EXE',
    '-NHC:\\Temp\\11.03.04\\EXE',
    '-NOC:\\Temp\\11.03.04\\DCU',
    '-W-', '-W-SYMBOL_PLATFORM', '-W-UNIT_PLATFORM', '-W-DUPLICATE_CTOR_DTOR', '-W-IMPLICIT_STRING_CAST',
    'BimerFaturamento.dpr',
  ],
  RELEASE: [
    '-B', '-$W+', '-$J+', '-$D0', '-$L-', '-$Y-', '-$O+',
    '--no-config', '-Q', '-H-', '-W-',
    '-TX.exe',
    `-A${DCC64_ALIAS_VALUE}`,
    '-DRELEASE;ALT_CEF133_0;EUREKALOG',
    '-EC:\\Temp\\11.03.04\\EXE',
    `-I${EXPECTED_DEPS}`,
    '-LEC:\\Temp\\11.03.04\\EXE',
    '-LNC:\\Temp\\11.03.04\\EXE',
    '-NUC:\\Temp\\11.03.04\\DCU',
    `-NS${DCC64_NS_VALUE}`,
    `-O${EXPECTED_DEPS}`,
    `-R${EXPECTED_DEPS}`,
    `-U${EXPECTED_DEPS}`,
    '-K00400000', '-GD',
    '-NBC:\\Temp\\11.03.04\\EXE',
    '-NHC:\\Temp\\11.03.04\\EXE',
    '-NOC:\\Temp\\11.03.04\\DCU',
    '-W-', '-W-SYMBOL_PLATFORM', '-W-UNIT_PLATFORM', '-W-DUPLICATE_CTOR_DTOR', '-W-IMPLICIT_STRING_CAST',
    'BimerFaturamento.dpr',
  ],
};

describe('fonte única dcc64-args - args idênticos ao baseline (código REAL)', () => {
  for (const type of ['FAST', 'DEBUG', 'RELEASE'] as BuildType[]) {
    it(`${type}: args do getDcc64Command devem ser idênticos ao baseline byte a byte`, () => {
      const { args } = getDcc64Command(makeOpts(type), 'BimerFaturamento');
      assert.deepStrictEqual(args, EXPECTED_ARGS[type]);
    });

    it(`${type}: exe do dcc64 deve apontar para o dcc64.exe do Delphi`, () => {
      const { exe } = getDcc64Command(makeOpts(type), 'BimerFaturamento');
      assert.strictEqual(exe, 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\bin\\dcc64.exe');
    });
  }

  it('exe path pós-build deve resolver o template de envVersion', () => {
    const { exe } = getBuiltExecutablePath(makeOpts('FAST'), 'BimerFaturamento');
    assert.strictEqual(exe, 'C:\\Temp\\11.03.04\\EXE\\BimerFaturamento.exe');
  });
});

describe('fonte única dcc64-args - consistência entre executor e inspetor', () => {
  it('compiler.ts e validate-commands.ts consomem exatamente a mesma função', async () => {
    const validateModule = await import('../src/build/validate-commands');
    const compilerModule = await import('../src/build/compiler');

    // validate-commands re-exporta getDcc64Command da fonte única
    assert.strictEqual(validateModule.getDcc64Command, getDcc64Command);
    // compiler re-exporta buildCompilerFlags da fonte única
    assert.strictEqual(compilerModule.buildCompilerFlags, buildCompilerFlags);
  });
});

describe('fonte única dcc64-args - helpers puros', () => {
  it('buildDependencies junta os paths com ponto e vírgula', () => {
    assert.strictEqual(
      buildDependencies({ dependencyPaths: ['a', 'b', 'c'] }),
      'a;b;c',
    );
  });

  it('resolveEnvTemplate substitui ${envVersion} e $envVersion', () => {
    assert.strictEqual(resolveEnvTemplate('X\\${envVersion}\\Y', '9.9'), 'X\\9.9\\Y');
    assert.strictEqual(resolveEnvTemplate('X\\$envVersion\\Y', '9.9'), 'X\\9.9\\Y');
  });

  it('DCC64_NS_VALUE usa Datasnap;Web (não Datasnap.Web)', () => {
    assert.ok(DCC64_NS_VALUE.includes(';Datasnap;Web;'));
    assert.ok(!DCC64_NS_VALUE.includes('Datasnap.Web'));
  });

  it('buildCompilerFlags marca runAfter corretamente por modo', () => {
    assert.strictEqual(buildCompilerFlags('FAST').runAfter, true);
    assert.strictEqual(buildCompilerFlags('DEBUG').runAfter, true);
    assert.strictEqual(buildCompilerFlags('RELEASE').runAfter, false);
  });
});

describe('modo DEBUG - diretivas de compilação de debug do EXE', () => {
  // Estas diretivas são o que torna o EXE gerado em modo DEBUG efetivamente
  // debugável. Remover qualquer uma quebra o debug do executável, mesmo que o
  // build continue "funcionando". Este bloco trava cada uma explicitamente.
  const debugArgs = () => getDcc64Command(makeOpts('DEBUG'), 'BimerFaturamento').args;

  it('-$D+ deve estar presente (debug information por unidade)', () => {
    assert.ok(debugArgs().includes('-$D+'));
  });

  it('-$L+ deve estar presente (local symbols para o debugger)', () => {
    assert.ok(debugArgs().includes('-$L+'));
  });

  it('-$Y+ deve estar presente (symbol reference info)', () => {
    assert.ok(debugArgs().includes('-$Y+'));
  });

  it('-$O- deve estar presente (otimização DESLIGADA para step-through confiável)', () => {
    assert.ok(debugArgs().includes('-$O-'));
    assert.ok(!debugArgs().includes('-$O+'), 'DEBUG não pode ter otimização ligada');
  });

  it('-V deve estar presente (embute debug info TD32 no EXE)', () => {
    assert.ok(debugArgs().includes('-V'));
  });

  it('-VR deve estar presente (símbolos de debug remoto .rsm)', () => {
    assert.ok(debugArgs().includes('-VR'));
  });

  it('a define condicional DEBUG deve estar ativa (ativa blocos {$IFDEF DEBUG})', () => {
    const dArg = debugArgs().find(a => a.startsWith('-D'));
    assert.ok(dArg, 'deve existir a flag -D com defines');
    assert.ok(/(^|;)DEBUG(;|$)/.test(dArg!.slice(2)), 'defines devem conter DEBUG');
  });

  it('DEBUG deve diferir de FAST exatamente por -B, -V e -VR', () => {
    const fast = buildCompilerFlags('FAST').flags;
    const debug = buildCompilerFlags('DEBUG').flags;
    const onlyInDebug = debug.filter(f => !fast.includes(f));
    assert.deepStrictEqual(onlyInDebug, ['-B', '-V', '-VR']);
  });

  it('DEBUG NÃO deve conter flags de RELEASE que desligam debug', () => {
    const debug = debugArgs();
    assert.ok(!debug.includes('-$D0'), 'DEBUG não pode ter -$D0 (debug info off)');
    assert.ok(!debug.includes('-$L-'), 'DEBUG não pode ter -$L- (local symbols off)');
    assert.ok(!debug.includes('-$Y-'), 'DEBUG não pode ter -$Y- (symbol info off)');
    assert.ok(!debug.includes('-$O+'), 'DEBUG não pode ter -$O+ (otimização on)');
  });

  it('RELEASE (contraste) NÃO deve ter -V nem -VR', () => {
    const release = getDcc64Command(makeOpts('RELEASE'), 'BimerFaturamento').args;
    assert.ok(!release.includes('-V'));
    assert.ok(!release.includes('-VR'));
  });
});
