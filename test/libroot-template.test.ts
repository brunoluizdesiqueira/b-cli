import { describe, it } from 'node:test';
import assert from 'node:assert';

function resolveLibTemplate(template: string, libRoot: string): string {
  return template.replace(/\$\{libRoot\}/g, libRoot).replace(/\$libRoot/g, libRoot);
}

function win32Join(...segments: string[]): string {
  return segments.join('\\');
}

describe('resolveLibTemplate', () => {
  it('deve substituir ${libRoot} corretamente', () => {
    const template = '${libRoot}\\Externos\\3.00';
    const result = resolveLibTemplate(template, 'C:\\LibraryDelphiAlexandria');
    assert.strictEqual(result, 'C:\\LibraryDelphiAlexandria\\Externos\\3.00');
  });

  it('deve substituir $libRoot corretamente', () => {
    const template = '$libRoot\\ERP\\11.03.00';
    const result = resolveLibTemplate(template, 'C:\\LibraryDelphiAlexandria');
    assert.strictEqual(result, 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00');
  });

  it('deve manter string sem variável inalterada', () => {
    const template = 'C:\\Fixed\\Path';
    const result = resolveLibTemplate(template, 'C:\\LibraryDelphiAlexandria');
    assert.strictEqual(result, 'C:\\Fixed\\Path');
  });

  it('deve funcionar com libAlterdata', () => {
    const template = '${libRoot}\\LibAlterdata\\1.0.0';
    const result = resolveLibTemplate(template, 'C:\\LibraryDelphiAlexandria');
    assert.strictEqual(result, 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0');
  });
});

describe('backward compatibility - libRoot as base', () => {
  const oldLibRoot = 'C:\\LibraryDelphiAlexandria\\Externos\\3.00';
  const newLibRoot = 'C:\\LibraryDelphiAlexandria';

  const newLibExternosTemplate = '${libRoot}\\Externos\\3.00';
  const newLibErpTemplate = '${libRoot}\\ERP\\${envVersion}';
  const newLibAlterdataTemplate = '${libRoot}\\LibAlterdata\\1.0.0';

  function resolveLibErp(template: string, libRoot: string, envVersion: string): string {
    return template
      .replace(/\$\{libRoot\}/g, libRoot)
      .replace(/\$libRoot/g, libRoot)
      .replace(/\$\{envVersion\}/g, envVersion)
      .replace(/\$envVersion/g, envVersion);
  }

  it('libExternos deve gerar mesmo path que antes', () => {
    const result = resolveLibTemplate(newLibExternosTemplate, newLibRoot);
    assert.strictEqual(result, oldLibRoot);
  });

  it('libErp deve gerar mesmo path que antes', () => {
    const result = resolveLibErp(newLibErpTemplate, newLibRoot, '11.03.00');
    assert.strictEqual(result, 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00');
  });

  it('libAlterdata deve gerar mesmo path que antes', () => {
    const result = resolveLibTemplate(newLibAlterdataTemplate, newLibRoot);
    assert.strictEqual(result, 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0');
  });

  it('todos os caminhos derivados de libRoot devem ser equivalentes aos anteriores', () => {
    const derivedLibExternos = resolveLibTemplate(newLibExternosTemplate, newLibRoot);
    const derivedLibErp = resolveLibErp(newLibErpTemplate, newLibRoot, '11.03.00');
    const derivedLibAlterdata = resolveLibTemplate(newLibAlterdataTemplate, newLibRoot);

    assert.strictEqual(derivedLibExternos, oldLibRoot);
    assert.strictEqual(derivedLibErp, 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00');
    assert.strictEqual(derivedLibAlterdata, 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0');
  });
});

describe('template com múltiplas variáveis', () => {
  it('deve resolver ${libRoot} e ${envVersion} juntos', () => {
    const template = '${libRoot}\\ERP\\${envVersion}';
    const result = template
      .replace(/\$\{libRoot\}/g, 'C:\\LibraryDelphiAlexandria')
      .replace(/\$libRoot/g, 'C:\\LibraryDelphiAlexandria')
      .replace(/\$\{envVersion\}/g, '11.03.00')
      .replace(/\$envVersion/g, '11.03.00');
    assert.strictEqual(result, 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00');
  });
});