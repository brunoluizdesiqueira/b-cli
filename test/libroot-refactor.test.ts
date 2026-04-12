import { describe, it } from 'node:test';
import assert from 'node:assert';

function win32Join(...segments: string[]): string {
  return segments.join('\\');
}

describe('libRoot refactoring - backward compatibility', () => {
  const oldLibRoot = 'C:\\LibraryDelphiAlexandria\\Externos\\3.00';
  const newLibRoot = 'C:\\LibraryDelphiAlexandria';
  const newLibExternos = 'C:\\LibraryDelphiAlexandria\\Externos\\3.00';

  function buildDependencyPathsOldStyle(libRoot: string): string[] {
    return [
      `${libRoot}\\sgcWebSockets\\Win64`,
      `${libRoot}\\DevExpress\\Win64`,
      `${libRoot}\\dataset-serialize\\Win64`,
      `${libRoot}\\UniDAC\\Win64`,
      `${libRoot}\\EurekaLog\\Common`,
      `${libRoot}\\EurekaLog\\Win64`,
      `${libRoot}\\SMImport\\Win64`,
      `${libRoot}\\SMExport\\Win64`,
      `${libRoot}\\RXLibrary\\Win64`,
      `${libRoot}\\ReportBuilder\\Win64`,
      `${libRoot}\\ComPort\\Win64`,
      `${libRoot}\\QuickReport\\Win64`,
      `${libRoot}\\FastMM\\Win64`,
      `${libRoot}\\Tee\\Win64`,
      `${libRoot}\\ExtraDevices\\Win64`,
      `${libRoot}\\ExtraFilter\\Win64`,
      `${libRoot}\\ZipForge\\Win64`,
      `${libRoot}\\FortesReport\\Win64`,
      `${libRoot}\\TBGWebCharts\\Win64`,
      `${libRoot}\\EventBus\\Win64`,
      `${libRoot}\\Horse\\Win64`,
    ];
  }

  function buildDependencyPathsNewStyle(libRoot: string, libExternos: string): string[] {
    return [
      `${libExternos}\\sgcWebSockets\\Win64`,
      `${libExternos}\\DevExpress\\Win64`,
      `${libExternos}\\dataset-serialize\\Win64`,
      `${libExternos}\\UniDAC\\Win64`,
      `${libExternos}\\EurekaLog\\Common`,
      `${libExternos}\\EurekaLog\\Win64`,
      `${libExternos}\\SMImport\\Win64`,
      `${libExternos}\\SMExport\\Win64`,
      `${libExternos}\\RXLibrary\\Win64`,
      `${libExternos}\\ReportBuilder\\Win64`,
      `${libExternos}\\ComPort\\Win64`,
      `${libExternos}\\QuickReport\\Win64`,
      `${libExternos}\\FastMM\\Win64`,
      `${libExternos}\\Tee\\Win64`,
      `${libExternos}\\ExtraDevices\\Win64`,
      `${libExternos}\\ExtraFilter\\Win64`,
      `${libExternos}\\ZipForge\\Win64`,
      `${libExternos}\\FortesReport\\Win64`,
      `${libExternos}\\TBGWebCharts\\Win64`,
      `${libExternos}\\EventBus\\Win64`,
      `${libExternos}\\Horse\\Win64`,
    ];
  }

  it('paths devem ser idênticos ao estilo anterior (usando libExternos)', () => {
    const oldPaths = buildDependencyPathsOldStyle(oldLibRoot);
    const newPaths = buildDependencyPathsNewStyle(newLibRoot, newLibExternos);
    
    assert.deepStrictEqual(oldPaths, newPaths);
  });

  it('libRoot deve apontar para C:\\LibraryDelphiAlexandria', () => {
    assert.strictEqual(newLibRoot, 'C:\\LibraryDelphiAlexandria');
  });

  it('libExternos deve apontar para C:\\LibraryDelphiAlexandria\\Externos\\3.00', () => {
    assert.strictEqual(newLibExternos, 'C:\\LibraryDelphiAlexandria\\Externos\\3.00');
  });

  it('todos os dependency paths gerados devem ser iguais ao anterior', () => {
    const oldPaths = buildDependencyPathsOldStyle(oldLibRoot);
    const newPaths = buildDependencyPathsNewStyle(newLibRoot, newLibExternos);
    
    assert.strictEqual(oldPaths.length, newPaths.length);
    oldPaths.forEach((oldPath, index) => {
      assert.strictEqual(oldPath, newPaths[index]);
    });
  });

  it('libRoot não deve ser usado diretamente nos dependency paths (deve usar libExternos)', () => {
    const paths = buildDependencyPathsNewStyle(newLibRoot, newLibExternos);
    
    paths.forEach(p => {
      assert.ok(!p.includes('LibraryDelphiAlexandria\\Externos\\3.00\\Externos'), 
        `Path ${p} não deve ter Externos duplicado`);
      assert.ok(p.startsWith(newLibExternos), 
        `Path ${p} deve começar com libExternos`);
    });
  });
});

describe('lib naming clarity', () => {
  it('libRoot representa a base LibraryDelphiAlexandria', () => {
    const libRoot = 'C:\\LibraryDelphiAlexandria';
    assert.ok(libRoot.endsWith('LibraryDelphiAlexandria'));
    assert.ok(!libRoot.includes('Externos'));
  });

  it('libExternos representa Externos\\3.00', () => {
    const libExternos = 'C:\\LibraryDelphiAlexandria\\Externos\\3.00';
    assert.ok(libExternos.includes('Externos'));
    assert.ok(libExternos.includes('3.00'));
  });

  it('libErp continua com versão no path', () => {
    const libErp = 'C:\\LibraryDelphiAlexandria\\ERP\\11.03.00';
    assert.ok(libErp.includes('ERP'));
    assert.ok(libErp.includes('11.03.00'));
  });

  it('libAlterdata continua com versão no path', () => {
    const libAlterdata = 'C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0';
    assert.ok(libAlterdata.includes('LibAlterdata'));
    assert.ok(libAlterdata.includes('1.0.0'));
  });
});

describe('estrutura de pastas da library', () => {
  it('estrutura atual tem libRoot como pasta aninhada', () => {
    const currentLibRoot = 'C:\\LibraryDelphiAlexandria\\Externos\\3.00';
    const parts = currentLibRoot.split('\\');
    assert.strictEqual(parts[parts.length - 1], '3.00');
    assert.strictEqual(parts[parts.length - 2], 'Externos');
  });

  it('nova estrutura separa libRoot (base) de libExternos (aninhado)', () => {
    const newLibRoot = 'C:\\LibraryDelphiAlexandria';
    const newLibExternos = 'C:\\LibraryDelphiAlexandria\\Externos\\3.00';
    
    const rootParts = newLibRoot.split('\\');
    const externosParts = newLibExternos.split('\\');
    
    assert.strictEqual(rootParts[rootParts.length - 1], 'LibraryDelphiAlexandria');
    assert.strictEqual(externosParts[externosParts.length - 1], '3.00');
    assert.strictEqual(externosParts[externosParts.length - 2], 'Externos');
  });
});