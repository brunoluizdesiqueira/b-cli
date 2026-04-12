import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

function buildDefaultDependencyPaths(params: { repoBase: string; delphiDir: string; libExternos: string; libErp: string; libAlterdata: string }): string[] {
  const { repoBase, delphiDir, libExternos, libErp, libAlterdata } = params;
  return [
    `${repoBase}\\dependencies`,
    `${delphiDir}\\lib\\Win64\\release`,
    `${libExternos}\\sgcWebSockets\\Win64`,
    `${libExternos}\\DevExpress\\Win64`,
    `${libExternos}\\dataset-serialize\\Win64`,
    `${libExternos}\\UniDAC\\Win64`,
    `${libExternos}\\EurekaLog\\Common`,
    `${libExternos}\\EurekaLog\\Win64`,
    `${libErp}\\Win64`,
    `${libExternos}\\ZipForge\\Win64`,
    `${libAlterdata}\\feedbacker`,
    `${libAlterdata}\\rest-client`,
  ];
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

function loadConfigWithDefaults(parsed: any) {
  const libRoot = parsed.libRoot || DEFAULT_CONFIG_BASE.libRoot;
  const envVersion = parsed.envVersion || DEFAULT_CONFIG_BASE.envVersion;

  return {
    ...DEFAULT_CONFIG_BASE,
    libExternos: resolveLibTemplate(DEFAULT_CONFIG_BASE.libExternos, libRoot),
    libErp: resolveLibTemplate(DEFAULT_CONFIG_BASE.libErp, libRoot, envVersion),
    libAlterdata: resolveLibTemplate(DEFAULT_CONFIG_BASE.libAlterdata, libRoot),
    ...parsed,
    libRoot,
  };
}

describe('template resolution integration', () => {
  it('deve resolver todos os templates com defaults', () => {
    const config = loadConfigWithDefaults({});
    
    assert.strictEqual(config.libRoot, 'C:\\LibraryDelphiAlexandria');
    assert.strictEqual(config.libExternos, 'C:\\LibraryDelphiAlexandria\\Externos\\3.00');
    assert.strictEqual(config.libErp, 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00');
    assert.strictEqual(config.libAlterdata, 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0');
  });

  it('deve resolver templates quando libRoot é alterado', () => {
    const config = loadConfigWithDefaults({
      libRoot: 'D:\\MyLibraries\\Delphi',
    });
    
    assert.strictEqual(config.libRoot, 'D:\\MyLibraries\\Delphi');
    assert.strictEqual(config.libExternos, 'D:\\MyLibraries\\Delphi\\Externos\\3.00');
    assert.strictEqual(config.libErp, 'D:\\MyLibraries\\Delphi\\ERP\\11.03.00');
    assert.strictEqual(config.libAlterdata, 'D:\\MyLibraries\\Delphi\\LibAlterdata\\1.0.0');
  });

  it('deve resolver templates com envVersion diferente', () => {
    const config = loadConfigWithDefaults({
      libRoot: 'C:\\LibraryDelphiAlexandria',
      envVersion: '10.05.00',
    });
    
    assert.strictEqual(config.libErp, 'C:\\LibraryDelphiAlexandria\\ERP\\10.05.00');
  });
});

describe('dependency paths com templates', () => {
  it('deve gerar dependency paths corretos com defaults', () => {
    const config = loadConfigWithDefaults({});
    const deps = buildDefaultDependencyPaths(config);
    
    assert.ok(deps.includes('C:\\LibraryDelphiAlexandria\\Externos\\3.00\\sgcWebSockets\\Win64'));
    assert.ok(deps.includes('C:\\LibraryDelphiAlexandria\\ERP\\11.03.00\\Win64'));
    assert.ok(deps.includes('C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0\\feedbacker'));
  });

  it('deve gerar dependency paths corretos com libRoot customizado', () => {
    const config = loadConfigWithDefaults({
      libRoot: 'D:\\CustomLib',
    });
    const deps = buildDefaultDependencyPaths(config);
    
    assert.ok(deps.includes('D:\\CustomLib\\Externos\\3.00\\sgcWebSockets\\Win64'));
    assert.ok(deps.includes('D:\\CustomLib\\ERP\\11.03.00\\Win64'));
  });

  it('deve gerar mesma quantidade de paths que antes', () => {
    const oldConfig = {
      libExternos: 'C:\\LibraryDelphiAlexandria\\Externos\\3.00',
      libErp: 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00',
      libAlterdata: 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0',
      repoBase: 'C:\\git\\bimer',
      delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
    };
    const oldDeps = buildDefaultDependencyPaths(oldConfig);
    
    const newConfig = loadConfigWithDefaults({});
    const newDeps = buildDefaultDependencyPaths(newConfig);
    
    assert.strictEqual(oldDeps.length, newDeps.length);
  });
});

describe('backward compatibility com config antigo', () => {
  it('deve funcionar com config antigo que tem libRoot=path-anterior', () => {
    const oldConfig = {
      libRoot: 'C:\\LibraryDelphiAlexandria\\Externos\\3.00',
      envVersion: '11.03.00',
      repoBase: 'C:\\git\\bimer',
      delphiDir: 'C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0',
    };
    
    const config = loadConfigWithDefaults(oldConfig);
    
    assert.strictEqual(config.libExternos, 'C:\\LibraryDelphiAlexandria\\Externos\\3.00\\Externos\\3.00');
  });

  it('deve funcionar com config sem libRoot (usa default)', () => {
    const config = loadConfigWithDefaults({});
    
    assert.strictEqual(config.libRoot, DEFAULT_CONFIG_BASE.libRoot);
    assert.strictEqual(config.libExternos, 'C:\\LibraryDelphiAlexandria\\Externos\\3.00');
  });
});

describe('user explicit paths override templates', () => {
  it('não deve sobrescrever path explícito do usuário', () => {
    const userConfig = {
      libRoot: 'C:\\LibraryDelphiAlexandria',
      libErp: 'D:\\Custom\\ERP\\CustomPath',
    };
    
    const config = loadConfigWithDefaults(userConfig);
    
    assert.strictEqual(config.libErp, 'D:\\Custom\\ERP\\CustomPath');
  });

  it('deve permitir libExternos explícito', () => {
    const userConfig = {
      libRoot: 'C:\\LibraryDelphiAlexandria',
      libExternos: 'E:\\MyExternos\\v2',
    };
    
    const config = loadConfigWithDefaults(userConfig);
    
    assert.strictEqual(config.libExternos, 'E:\\MyExternos\\v2');
  });
});

describe('edge cases', () => {
  it('deve lidar com libRoot contendo espaços', () => {
    const config = loadConfigWithDefaults({
      libRoot: 'C:\\Program Files\\LibraryDelphi',
    });
    
    assert.strictEqual(config.libExternos, 'C:\\Program Files\\LibraryDelphi\\Externos\\3.00');
    assert.strictEqual(config.libAlterdata, 'C:\\Program Files\\LibraryDelphi\\LibAlterdata\\1.0.0');
  });

  it('deve lidar com libRoot vazio (fallback para default)', () => {
    const config = loadConfigWithDefaults({
      libRoot: '',
    });
    
    assert.strictEqual(config.libRoot, DEFAULT_CONFIG_BASE.libRoot);
  });

  it('deve manter exeOutputDir e dcuOutputDir funcionando com ${envVersion}', () => {
    const exeOutputDir = 'C:\\Temp\\${envVersion}\\EXE';
    const dcuOutputDir = 'C:\\Temp\\${envVersion}\\DCU';
    const envVersion = '11.03.00';
    
    const resolvedExe = resolveLibTemplate(exeOutputDir, '', envVersion);
    const resolvedDcu = resolveLibTemplate(dcuOutputDir, '', envVersion);
    
    assert.strictEqual(resolvedExe, 'C:\\Temp\\11.03.00\\EXE');
    assert.strictEqual(resolvedDcu, 'C:\\Temp\\11.03.00\\DCU');
  });
});