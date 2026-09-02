import { describe, it } from 'node:test';
import assert from 'node:assert';

import { resolveProjectInput } from '../src/ui/prompts';
import { resolveProject } from '../src/build/project';

const PROJECTS = {
  BimerFaturamento: 'faturamento\\BimerFaturamento',
  Bimer: 'Bimer',
  LiberadorEstoque: 'geral\\gerenteeletronico.jobs.liberadorestoque\\LiberadorEstoque',
};

describe('resolveProjectInput', () => {
  it('deve resolver o NOME (chave) para o caminho relativo configurado', () => {
    assert.strictEqual(
      resolveProjectInput('BimerFaturamento', PROJECTS),
      'faturamento\\BimerFaturamento',
    );
  });

  it('deve resolver corretamente projeto com caminho aninhado', () => {
    assert.strictEqual(
      resolveProjectInput('LiberadorEstoque', PROJECTS),
      'geral\\gerenteeletronico.jobs.liberadorestoque\\LiberadorEstoque',
    );
  });

  it('deve manter o CAMINHO relativo quando já informado diretamente', () => {
    assert.strictEqual(
      resolveProjectInput('faturamento\\BimerFaturamento', PROJECTS),
      'faturamento\\BimerFaturamento',
    );
  });

  it('deve manter valor arbitrário que não é chave conhecida', () => {
    assert.strictEqual(
      resolveProjectInput('outro\\Projeto', PROJECTS),
      'outro\\Projeto',
    );
  });

  it('deve tratar projeto cujo nome é igual ao caminho (Bimer)', () => {
    assert.strictEqual(resolveProjectInput('Bimer', PROJECTS), 'Bimer');
  });
});

describe('resolveProjectInput + resolveProject - consistência de projectName (regressão B1)', () => {
  it('deve derivar o mesmo projectName do build quando a chave difere do basename', () => {
    // Config onde a CHAVE ("Fat") difere do basename do caminho
    // ("BimerFaturamento"). O validate-commands deve gerar o mesmo nome de
    // projeto que o build real (que usa resolveProject sobre o caminho).
    const projects = { Fat: 'faturamento\\BimerFaturamento' };
    const repoBase = 'c:\\git\\bimer-workspace\\bimer';

    const resolvedPath = resolveProjectInput('Fat', projects);
    const { projectName } = resolveProject(resolvedPath, repoBase);

    assert.strictEqual(resolvedPath, 'faturamento\\BimerFaturamento');
    assert.strictEqual(projectName, 'BimerFaturamento');
  });

  it('deve derivar projectName correto quando o caminho é informado diretamente', () => {
    const projects = { Fat: 'faturamento\\BimerFaturamento' };
    const repoBase = 'c:\\git\\bimer-workspace\\bimer';

    const resolvedPath = resolveProjectInput('faturamento\\BimerFaturamento', projects);
    const { projectName } = resolveProject(resolvedPath, repoBase);

    assert.strictEqual(projectName, 'BimerFaturamento');
  });
});
