import { describe, it } from 'node:test';
import assert from 'node:assert';

import { getRunExecutableSpawnOptions } from '../src/build/compiler';

const EXE = 'C:\\Temp\\11.03.00\\EXE\\BimerFaturamento.exe';

describe('getRunExecutableSpawnOptions - modo padrão (sem attach)', () => {
  it('deve rodar desanexado e ignorar a saída', () => {
    const { spawnOptions } = getRunExecutableSpawnOptions({ attach: false }, EXE);
    assert.strictEqual(spawnOptions.detached, true);
    assert.strictEqual(spawnOptions.stdio, 'ignore');
  });

  it('não deve aguardar o encerramento do app', () => {
    const { waitForExit } = getRunExecutableSpawnOptions({ attach: false }, EXE);
    assert.strictEqual(waitForExit, false);
  });

  it('deve tratar attach undefined como modo padrão', () => {
    const { spawnOptions, waitForExit } = getRunExecutableSpawnOptions({}, EXE);
    assert.strictEqual(spawnOptions.detached, true);
    assert.strictEqual(spawnOptions.stdio, 'ignore');
    assert.strictEqual(waitForExit, false);
  });

  it('deve definir cwd como o diretório do executável', () => {
    const { spawnOptions } = getRunExecutableSpawnOptions({ attach: false }, EXE);
    assert.strictEqual(spawnOptions.cwd, 'C:\\Temp\\11.03.00\\EXE');
  });
});

describe('getRunExecutableSpawnOptions - modo attach', () => {
  it('deve rodar anexado e herdar a saída (stdio inherit) para exibir stacktrace', () => {
    const { spawnOptions } = getRunExecutableSpawnOptions({ attach: true }, EXE);
    assert.strictEqual(spawnOptions.detached, false);
    assert.strictEqual(spawnOptions.stdio, 'inherit');
  });

  it('deve aguardar o encerramento do app', () => {
    const { waitForExit } = getRunExecutableSpawnOptions({ attach: true }, EXE);
    assert.strictEqual(waitForExit, true);
  });

  it('deve definir cwd como o diretório do executável', () => {
    const { spawnOptions } = getRunExecutableSpawnOptions({ attach: true }, EXE);
    assert.strictEqual(spawnOptions.cwd, 'C:\\Temp\\11.03.00\\EXE');
  });
});
