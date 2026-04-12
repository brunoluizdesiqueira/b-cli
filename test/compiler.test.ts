import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';

function resolveEnvTemplate(template: string, envVersion: string): string {
  return template.replace(/\$\{envVersion\}/g, envVersion).replace(/\$envVersion/g, envVersion);
}

function win32Join(...segments: string[]): string {
  return segments.join('\\');
}

describe('resolveEnvTemplate', () => {
  it('deve substituir ${envVersion} pelo valor correto', () => {
    const template = 'C:\\Temp\\${envVersion}\\EXE';
    const result = resolveEnvTemplate(template, '11.03.00');
    assert.strictEqual(result, 'C:\\Temp\\11.03.00\\EXE');
  });

  it('deve substituir $envVersion pelo valor correto', () => {
    const template = 'C:\\Temp\\$envVersion\\DCU';
    const result = resolveEnvTemplate(template, '11.03.00');
    assert.strictEqual(result, 'C:\\Temp\\11.03.00\\DCU');
  });

  it('deve manter string inalterada sem variáveis', () => {
    const template = 'C:\\Output\\EXE';
    const result = resolveEnvTemplate(template, '11.03.00');
    assert.strictEqual(result, 'C:\\Output\\EXE');
  });

  it('deve funcionar com paths sem variáveis', () => {
    const template = 'D:\\Build\\Output';
    const result = resolveEnvTemplate(template, '11.03.00');
    assert.strictEqual(result, 'D:\\Build\\Output');
  });
});

describe('path compatibility - backward compatibility', () => {
  it('exeOutput deve gerar mesmo path que antes (C:\\Temp\\envVersion\\EXE)', () => {
    const exeOutputDir = 'C:\\Temp\\${envVersion}\\EXE';
    const envVersion = '11.03.00';
    const projectName = 'BimerFaturamento';

    const exeOut = resolveEnvTemplate(exeOutputDir, envVersion);
    const fullPath = win32Join(exeOut, `${projectName}.exe`);

    assert.strictEqual(fullPath, 'C:\\Temp\\11.03.00\\EXE\\BimerFaturamento.exe');
  });

  it('dcuOutput deve gerar mesmo path que antes (C:\\Temp\\envVersion\\DCU)', () => {
    const dcuOutputDir = 'C:\\Temp\\${envVersion}\\DCU';
    const envVersion = '11.03.00';

    const dcuOut = resolveEnvTemplate(dcuOutputDir, envVersion);

    assert.strictEqual(dcuOut, 'C:\\Temp\\11.03.00\\DCU');
  });

  it('deve funcionar com envVersion diferente', () => {
    const exeOutputDir = 'C:\\Temp\\${envVersion}\\EXE';
    const envVersion = '10.05.00';

    const exeOut = resolveEnvTemplate(exeOutputDir, envVersion);

    assert.strictEqual(exeOut, 'C:\\Temp\\10.05.00\\EXE');
  });

  it('paths alternativos devem funcionar', () => {
    const exeOutputDir = 'D:\\CustomPath\\${envVersion}\\Bin';
    const dcuOutputDir = 'D:\\CustomPath\\${envVersion}\\DCU';
    const envVersion = '11.03.00';

    const exeOut = resolveEnvTemplate(exeOutputDir, envVersion);
    const dcuOut = resolveEnvTemplate(dcuOutputDir, envVersion);

    assert.strictEqual(exeOut, 'D:\\CustomPath\\11.03.00\\Bin');
    assert.strictEqual(dcuOut, 'D:\\CustomPath\\11.03.00\\DCU');
  });
});

describe('edge cases', () => {
  it('deve tratar string vazia', () => {
    const result = resolveEnvTemplate('', '11.03.00');
    assert.strictEqual(result, '');
  });

  it('deve tratar template sem envVersion', () => {
    const template = 'C:\\StaticPath';
    const result = resolveEnvTemplate(template, '11.03.00');
    assert.strictEqual(result, 'C:\\StaticPath');
  });

  it('deve tratar múltiplas substituições', () => {
    const template = '${envVersion}\\${envVersion}';
    const result = resolveEnvTemplate(template, '11');
    assert.strictEqual(result, '11\\11');
  });
});

describe('libErp auto-derivation', () => {
  function deriveLibErp(envVersion: string, explicitLibErp?: string): string {
    return explicitLibErp || `C:\\LibraryDelphiAlexandria\\ERP\\${envVersion}`;
  }

  it('deve derivar libErp automaticamente quando vazio', () => {
    const result = deriveLibErp('11.03.00');
    assert.strictEqual(result, 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00');
  });

  it('deve usar libErp explícito quando fornecido', () => {
    const result = deriveLibErp('11.03.00', 'D:\\Custom\\ERP\\11.03.00');
    assert.strictEqual(result, 'D:\\Custom\\ERP\\11.03.00');
  });

  it('deve funcionar com versão diferente', () => {
    const result = deriveLibErp('10.05.00');
    assert.strictEqual(result, 'C:\\LibraryDelphiAlexandria\\ERP\\10.05.00');
  });
});

describe('config defaults backward compatibility', () => {
  it('exeOutputDir default deve ser igual ao path anterior', () => {
    const exeOutputDir = 'C:\\Temp\\${envVersion}\\EXE';
    const envVersion = '11.03.00';
    
    const exeOut = resolveEnvTemplate(exeOutputDir, envVersion);
    const expectedOldPath = win32Join('C:\\Temp', envVersion, 'EXE');
    
    assert.strictEqual(exeOut, expectedOldPath);
  });

  it('dcuOutputDir default deve ser igual ao path anterior', () => {
    const dcuOutputDir = 'C:\\Temp\\${envVersion}\\DCU';
    const envVersion = '11.03.00';
    
    const dcuOut = resolveEnvTemplate(dcuOutputDir, envVersion);
    const expectedOldPath = win32Join('C:\\Temp', envVersion, 'DCU');
    
    assert.strictEqual(dcuOut, expectedOldPath);
  });

  it('old hardcoded exe path deve ser equivalente ao novo', () => {
    const oldExePath = path.win32.join('C:\\Temp', '11.03.00', 'EXE', 'BimerFaturamento.exe');
    const newExePath = win32Join(resolveEnvTemplate('C:\\Temp\\${envVersion}\\EXE', '11.03.00'), 'BimerFaturamento.exe');
    
    assert.strictEqual(newExePath, oldExePath);
  });

  it('old hardcoded dcu path deve ser equivalente ao novo', () => {
    const oldDcuPath = path.win32.join('C:\\Temp', '11.03.00', 'DCU');
    const newDcuPath = resolveEnvTemplate('C:\\Temp\\${envVersion}\\DCU', '11.03.00');
    
    assert.strictEqual(newDcuPath, oldDcuPath);
  });
});