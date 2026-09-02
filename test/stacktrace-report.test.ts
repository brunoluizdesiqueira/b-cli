import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  parseReport,
  formatReportForTerminal,
  resolveReportDirTemplate,
} from '../src/build/stacktrace-report';

// Relatório mínimo no formato EurekaLog: campos numerados + tabela de pilha em pipe.
const SAMPLE = [
  '  2.1 Date/time         : 2026-09-02 14:20:00',
  '  2.2 Address           : 00000000004A1B2C',
  '  2.5 Exception type    : EAccessViolation',
  '  2.6 Exception message : Access violation at address 004A1B2C.',
  '',
  '|Methods|Details|Stack|Address|Offset|Module|Unit|Source|Class|Procedure|Line|',
  '|       |       |     |004A1B2C|0|BimerFaturamento.exe|FatPedidoBLL|FatPedidoBLL.pas|TFatPedido|Salvar|142|',
  '|       |       |     |004A1000|0|BimerFaturamento.exe|FatPedidoC|FatPedidoC.pas|TFatPedidoForm|btnSalvarClick|88|',
  '|       |       |     |7FFB1234|0|kernel32.dll||||BaseThreadInitThunk|0|',
  '',
].join('\n');

describe('parseReport - extração de exceção', () => {
  it('deve extrair tipo e mensagem pelos campos numerados', () => {
    const r = parseReport(SAMPLE);
    assert.strictEqual(r.exception.type, 'EAccessViolation');
    assert.strictEqual(r.exception.message, 'Access violation at address 004A1B2C.');
  });

  it('deve marcar recognized=true quando há exceção e pilha', () => {
    assert.strictEqual(parseReport(SAMPLE).recognized, true);
  });

  it('deve marcar recognized=false para conteúdo sem estrutura reconhecível', () => {
    assert.strictEqual(parseReport('texto qualquer sem formato').recognized, false);
  });
});

describe('parseReport - tabela de pilha', () => {
  it('deve extrair todos os frames da tabela', () => {
    assert.strictEqual(parseReport(SAMPLE).stack.length, 3);
  });

  it('deve mapear a coluna Procedure corretamente (não confundir com Methods)', () => {
    // Regressão: "Methods" contém a substring "Method"; o regex de Procedure
    // sem âncora casava a coluna errada, deixando o nome do método vazio.
    const frames = parseReport(SAMPLE).stack;
    assert.strictEqual(frames[0].procedure, 'Salvar');
    assert.strictEqual(frames[1].procedure, 'btnSalvarClick');
  });

  it('deve preencher unit, class e line dos frames do app', () => {
    const f = parseReport(SAMPLE).stack[0];
    assert.strictEqual(f.unit, 'FatPedidoBLL');
    assert.strictEqual(f.className, 'TFatPedido');
    assert.strictEqual(f.line, '142');
  });

  it('deve marcar isAppFrame=true para frames com .pas em .exe do app', () => {
    const frames = parseReport(SAMPLE).stack;
    assert.strictEqual(frames[0].isAppFrame, true);
    assert.strictEqual(frames[1].isAppFrame, true);
  });

  it('deve marcar isAppFrame=false para frames de DLL de sistema', () => {
    const frames = parseReport(SAMPLE).stack;
    assert.strictEqual(frames[2].isAppFrame, false);
  });
});

describe('formatReportForTerminal', () => {
  it('deve incluir tipo, mensagem e frames do app na saída', () => {
    const out = formatReportForTerminal(parseReport(SAMPLE), 'C:\\tmp\\crash.el');
    assert.match(out, /EAccessViolation/);
    assert.match(out, /TFatPedido\.Salvar/);
    assert.match(out, /linha 142/);
    assert.match(out, /crash\.el/);
  });
});

describe('resolveReportDirTemplate', () => {
  it('deve resolver ${envVersion}', () => {
    assert.strictEqual(
      resolveReportDirTemplate('C:\\Logs\\${envVersion}', '11.03.04'),
      'C:\\Logs\\11.03.04',
    );
  });

  it('deve resolver ${userProfile} para o home do usuário', () => {
    const out = resolveReportDirTemplate('${userProfile}\\EurekaLog', '11.03.04');
    assert.ok(out.endsWith('\\EurekaLog'));
    assert.ok(!out.includes('${userProfile}'));
  });
});
