import { describe, it } from 'node:test';
import assert from 'node:assert';

function resolveLibTemplate(template: string, libRoot: string, envVersion?: string): string {
  let result = template
    .replace(/\$\{libRoot\}/g, libRoot)
    .replace(/\$libRoot/g, libRoot);
  
  if (envVersion) {
    result = result
      .replace(/\$\{envVersion\}/g, envVersion)
      .replace(/\$envVersion/g, envVersion);
  }
  
  return result;
}

const DEFAULT_CONFIG_BASE = {
  repoBase: 'C:\\git\\bimer',
  delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
  envVersion: '11.03.00',
  libRoot: 'C:\\LibraryDelphiAlexandria',
  libExternos: '${libRoot}\\Externos\\3.00',
  libErp: '${libRoot}\\ERP\\${envVersion}',
  libAlterdata: '${libRoot}\\LibAlterdata\\1.0.0',
};

function processConfig(parsed: any) {
  const merged: any = {
    ...DEFAULT_CONFIG_BASE,
    ...parsed,
    libRoot: parsed.libRoot || DEFAULT_CONFIG_BASE.libRoot,
    envVersion: parsed.envVersion || DEFAULT_CONFIG_BASE.envVersion,
  };

  const libRoot = merged.libRoot;
  const envVersion = merged.envVersion;

  const isLegacyLibRoot = libRoot.endsWith('Externos\\3.00');

  if (isLegacyLibRoot) {
    merged.libRoot = libRoot.replace('\\Externos\\3.00', '');
    merged.libExternos = libRoot;
    merged.libErp = `${merged.libRoot}\\ERP\\${envVersion}`;
    merged.libAlterdata = `${merged.libRoot}\\LibAlterdata\\1.0.0`;
  } else {
    merged.libExternos = resolveLibTemplate(DEFAULT_CONFIG_BASE.libExternos, libRoot);
    merged.libErp = resolveLibTemplate(DEFAULT_CONFIG_BASE.libErp, libRoot, envVersion);
    merged.libAlterdata = resolveLibTemplate(DEFAULT_CONFIG_BASE.libAlterdata, libRoot);
  }

  return merged;
}

describe('legacy libRoot migration', () => {
  it('deve migrar libRoot legado (com Externos\\3.00) corretamente', () => {
    const config = processConfig({
      libRoot: 'C:\\LibraryDelphiAlexandria\\Externos\\3.00',
      envVersion: '11.03.00',
    });

    assert.strictEqual(config.libRoot, 'C:\\LibraryDelphiAlexandria');
    assert.strictEqual(config.libExternos, 'C:\\LibraryDelphiAlexandria\\Externos\\3.00');
    assert.strictEqual(config.libErp, 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00');
    assert.strictEqual(config.libAlterdata, 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0');
  });

  it('deve migrar libRoot legado com envVersion diferente', () => {
    const config = processConfig({
      libRoot: 'C:\\LibraryDelphiAlexandria\\Externos\\3.00',
      envVersion: '10.05.00',
    });

    assert.strictEqual(config.libRoot, 'C:\\LibraryDelphiAlexandria');
    assert.strictEqual(config.libErp, 'C:\\LibraryDelphiAlexandria\\ERP\\10.05.00');
  });

  it('não deve modificar libRoot novo (sem Externos\\3.00)', () => {
    const config = processConfig({
      libRoot: 'C:\\LibraryDelphiAlexandria',
      envVersion: '11.03.00',
    });

    assert.strictEqual(config.libRoot, 'C:\\LibraryDelphiAlexandria');
    assert.strictEqual(config.libExternos, 'C:\\LibraryDelphiAlexandria\\Externos\\3.00');
    assert.strictEqual(config.libErp, 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00');
    assert.strictEqual(config.libAlterdata, 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0');
  });

  it('libRoot novo deve usar templates', () => {
    const config = processConfig({
      libRoot: 'D:\\MyLibraries\\Delphi',
      envVersion: '11.03.00',
    });

    assert.strictEqual(config.libRoot, 'D:\\MyLibraries\\Delphi');
    assert.strictEqual(config.libExternos, 'D:\\MyLibraries\\Delphi\\Externos\\3.00');
    assert.strictEqual(config.libErp, 'D:\\MyLibraries\\Delphi\\ERP\\11.03.00');
    assert.strictEqual(config.libAlterdata, 'D:\\MyLibraries\\Delphi\\LibAlterdata\\1.0.0');
  });

  it('paths resultantes devem ser iguais ao original (backward compatibility)', () => {
    const legacyConfig = processConfig({
      libRoot: 'C:\\LibraryDelphiAlexandria\\Externos\\3.00',
      envVersion: '11.03.00',
    });

    const expectedLibExternos = 'C:\\LibraryDelphiAlexandria\\Externos\\3.00';
    const expectedLibErp = 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00';
    const expectedLibAlterdata = 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0';

    assert.strictEqual(legacyConfig.libExternos, expectedLibExternos);
    assert.strictEqual(legacyConfig.libErp, expectedLibErp);
    assert.strictEqual(legacyConfig.libAlterdata, expectedLibAlterdata);
  });

  it('paths com libRoot novo devem ser equivalentes aos caminhos originais', () => {
    const newConfig = processConfig({
      libRoot: 'C:\\LibraryDelphiAlexandria',
      envVersion: '11.03.00',
    });

    const expectedLibExternos = 'C:\\LibraryDelphiAlexandria\\Externos\\3.00';
    const expectedLibErp = 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00';
    const expectedLibAlterdata = 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0';

    assert.strictEqual(newConfig.libExternos, expectedLibExternos);
    assert.strictEqual(newConfig.libErp, expectedLibErp);
    assert.strictEqual(newConfig.libAlterdata, expectedLibAlterdata);
  });

  it('deve preservar libRoot existente se não for legacy', () => {
    const config = processConfig({
      libRoot: 'E:\\CustomPath\\Library',
      envVersion: '11.03.00',
    });

    assert.strictEqual(config.libRoot, 'E:\\CustomPath\\Library');
    assert.strictEqual(config.libExternos, 'E:\\CustomPath\\Library\\Externos\\3.00');
  });

  it('deve funcionar com paths contendo espaços', () => {
    const config = processConfig({
      libRoot: 'C:\\Program Files\\LibraryDelphi',
      envVersion: '11.03.00',
    });

    assert.strictEqual(config.libRoot, 'C:\\Program Files\\LibraryDelphi');
    assert.strictEqual(config.libExternos, 'C:\\Program Files\\LibraryDelphi\\Externos\\3.00');
    assert.strictEqual(config.libErp, 'C:\\Program Files\\LibraryDelphi\\ERP\\11.03.00');
  });
});

describe('templates resolution', () => {
  it('deve resolver ${libRoot} em templates', () => {
    const result = resolveLibTemplate('${libRoot}\\Externos\\3.00', 'C:\\Library');
    assert.strictEqual(result, 'C:\\Library\\Externos\\3.00');
  });

  it('deve resolver ${libRoot} e ${envVersion} juntos', () => {
    const result = resolveLibTemplate('${libRoot}\\ERP\\${envVersion}', 'C:\\Library', '11.03.00');
    assert.strictEqual(result, 'C:\\Library\\ERP\\11.03.00');
  });

  it('deve resolver $libRoot (sem chaves)', () => {
    const result = resolveLibTemplate('$libRoot\\Externos\\3.00', 'C:\\Library');
    assert.strictEqual(result, 'C:\\Library\\Externos\\3.00');
  });
});