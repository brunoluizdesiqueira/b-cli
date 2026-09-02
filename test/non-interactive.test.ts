import { describe, it } from 'node:test';
import assert from 'node:assert';

import { defaultAnswers } from '../src/ui/prompts';

describe('defaultAnswers - fallback não-interativo', () => {
  it('deve usar a propriedade default de perguntas de input', () => {
    const a = defaultAnswers([{ name: 'version', default: '11.03.04' }]);
    assert.strictEqual(a.version, '11.03.04');
  });

  it('deve usar a primeira choice quando a lista não tem default', () => {
    const a = defaultAnswers([
      { name: 'project', choices: [{ value: 'faturamento\\BimerFaturamento' }, { value: 'Bimer' }] },
    ]);
    assert.strictEqual(a.project, 'faturamento\\BimerFaturamento');
  });

  it('deve preferir o default explícito sobre as choices', () => {
    const a = defaultAnswers([
      { name: 'type', default: 'DEBUG', choices: [{ value: 'FAST' }, { value: 'DEBUG' }] },
    ]);
    assert.strictEqual(a.type, 'DEBUG');
  });

  it('deve resolver múltiplas perguntas de uma vez', () => {
    const a = defaultAnswers([
      { name: 'type', default: 'DEBUG' },
      { name: 'project', choices: [{ value: 'Bimer' }] },
      { name: 'version', default: '11.03.04' },
    ]);
    assert.deepStrictEqual(a, { type: 'DEBUG', project: 'Bimer', version: '11.03.04' });
  });

  it('deve retornar objeto vazio quando não há perguntas', () => {
    assert.deepStrictEqual(defaultAnswers([]), {});
  });

  it('deve ignorar pergunta sem default e sem choices', () => {
    assert.deepStrictEqual(defaultAnswers([{ name: 'x' }]), {});
  });
});
