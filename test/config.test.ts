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

function resolveEnvTemplate(template: string, envVersion: string): string {
  return template
    .replace(/\$\{envVersion\}/g, envVersion)
    .replace(/\$envVersion/g, envVersion);
}

describe('resolveLibTemplate', () => {
  it('deve substituir ${libRoot} corretamente', () => {
    const result = resolveLibTemplate('${libRoot}\\External\\3.00', 'C:\\Library');
    assert.strictEqual(result, 'C:\\Library\\External\\3.00');
  });

  it('deve resolver ${libRoot} e ${envVersion} juntos', () => {
    const result = resolveLibTemplate('${libRoot}\\ERP\\${envVersion}', 'C:\\Library', '11.03.00');
    assert.strictEqual(result, 'C:\\Library\\ERP\\11.03.00');
  });
});

describe('resolveEnvTemplate', () => {
  it('deve substituir ${envVersion} corretamente', () => {
    const result = resolveEnvTemplate('C:\\Temp\\${envVersion}\\EXE', '11.03.00');
    assert.strictEqual(result, 'C:\\Temp\\11.03.00\\EXE');
  });
});

describe('config with new format', () => {
  it('deve usar novo formato de libRoot corretamente', () => {
    const libRoot = 'C:\\Library';
    const envVersion = '11.03.00';
    
    const libExternal = resolveLibTemplate('${libRoot}\\External\\3.00', libRoot);
    const libErp = resolveLibTemplate('${libRoot}\\ERP\\${envVersion}', libRoot, envVersion);
    const libCompany = resolveLibTemplate('${libRoot}\\CompanyLibrary\\1.0.0', libRoot);
    
    assert.strictEqual(libExternal, 'C:\\Library\\External\\3.00');
    assert.strictEqual(libErp, 'C:\\Library\\ERP\\11.03.00');
    assert.strictEqual(libCompany, 'C:\\Library\\CompanyLibrary\\1.0.0');
  });

  it('deve funcionar com libRoot customizado', () => {
    const libRoot = 'D:\\CustomLib';
    const envVersion = '10.05.00';
    
    const libExternal = resolveLibTemplate('${libRoot}\\External\\3.00', libRoot);
    const libErp = resolveLibTemplate('${libRoot}\\ERP\\${envVersion}', libRoot, envVersion);
    const libCompany = resolveLibTemplate('${libRoot}\\CompanyLibrary\\1.0.0', libRoot);
    
    assert.strictEqual(libExternal, 'D:\\CustomLib\\External\\3.00');
    assert.strictEqual(libErp, 'D:\\CustomLib\\ERP\\10.05.00');
    assert.strictEqual(libCompany, 'D:\\CustomLib\\CompanyLibrary\\1.0.0');
  });
});

describe('exe and dcu output paths', () => {
  it('deve resolver exeOutputDir corretamente', () => {
    const exeOutputDir = 'C:\\Temp\\${envVersion}\\EXE';
    const envVersion = '11.03.00';
    
    const resolved = resolveEnvTemplate(exeOutputDir, envVersion);
    assert.strictEqual(resolved, 'C:\\Temp\\11.03.00\\EXE');
  });

  it('deve resolver dcuOutputDir corretamente', () => {
    const dcuOutputDir = 'C:\\Temp\\${envVersion}\\DCU';
    const envVersion = '11.03.00';
    
    const resolved = resolveEnvTemplate(dcuOutputDir, envVersion);
    assert.strictEqual(resolved, 'C:\\Temp\\11.03.00\\DCU');
  });
});