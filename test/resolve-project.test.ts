import { describe, it } from 'node:test';
import assert from 'node:assert';

import { resolveProjectInput } from '../src/ui/prompts';

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
