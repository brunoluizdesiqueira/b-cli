import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  parseDcc64Diagnostics,
  summarizeDiagnostics,
  formatDiagnosticsReport,
  Diagnostic,
} from '../src/build/diagnostics';

// Amostras REAIS capturadas do dcc64 (Delphi 35.0, com -Q).
const REAL_OUTPUT = [
  'Embarcadero Delphi for Win64 compiler version 35.0',
  'Copyright (c) 1983,2021 Embarcadero Technologies, Inc.',
  "Probe.dpr(9) Warning: W1035 Return value of function 'Foo' might be undefined",
  "Probe.dpr(5) Hint: H2164 Variable 'Unused' is declared but never used in 'Foo'",
  "Probe.dpr(12) Error: E2003 Undeclared identifier: 'UndeclaredIdentifier'",
  "Probe2.dpr(4) Fatal: F2613 Unit 'UnitQueNaoExiste' not found.",
].join('\r\n');

describe('parseDcc64Diagnostics - parsing das amostras reais', () => {
  const diags = parseDcc64Diagnostics(REAL_OUTPUT);

  it('deve extrair exatamente 4 diagnósticos (ignora banner/copyright)', () => {
    assert.strictEqual(diags.length, 4);
  });

  it('deve parsear o WARNING corretamente', () => {
    const w = diags.find(d => d.code === 'W1035')!;
    assert.ok(w, 'W1035 deve existir');
    assert.strictEqual(w.severity, 'warning');
    assert.strictEqual(w.file, 'Probe.dpr');
    assert.strictEqual(w.line, 9);
    assert.strictEqual(w.message, "Return value of function 'Foo' might be undefined");
  });

  it('deve parsear o HINT corretamente', () => {
    const h = diags.find(d => d.code === 'H2164')!;
    assert.ok(h, 'H2164 deve existir');
    assert.strictEqual(h.severity, 'hint');
    assert.strictEqual(h.file, 'Probe.dpr');
    assert.strictEqual(h.line, 5);
    assert.strictEqual(h.message, "Variable 'Unused' is declared but never used in 'Foo'");
  });

  it('deve parsear o ERROR corretamente', () => {
    const e = diags.find(d => d.code === 'E2003')!;
    assert.ok(e, 'E2003 deve existir');
    assert.strictEqual(e.severity, 'error');
    assert.strictEqual(e.file, 'Probe.dpr');
    assert.strictEqual(e.line, 12);
    assert.strictEqual(e.message, "Undeclared identifier: 'UndeclaredIdentifier'");
  });

  it('deve parsear o FATAL corretamente', () => {
    const f = diags.find(d => d.code === 'F2613')!;
    assert.ok(f, 'F2613 deve existir');
    assert.strictEqual(f.severity, 'fatal');
    assert.strictEqual(f.file, 'Probe2.dpr');
    assert.strictEqual(f.line, 4);
    assert.strictEqual(f.message, "Unit 'UnitQueNaoExiste' not found.");
  });
});

describe('parseDcc64Diagnostics - casos de borda', () => {
  it('deve retornar lista vazia para saída sem diagnósticos', () => {
    const out = [
      'Embarcadero Delphi for Win64 compiler version 35.0',
      'Copyright (c) 1983,2021 Embarcadero Technologies, Inc.',
      '368158 lines, 28.14 seconds, 154495152 bytes code, 10030396 bytes data.',
    ].join('\n');
    assert.deepStrictEqual(parseDcc64Diagnostics(out), []);
  });

  it('deve retornar lista vazia para string vazia', () => {
    assert.deepStrictEqual(parseDcc64Diagnostics(''), []);
  });

  it('deve lidar com quebras de linha \\n e \\r\\n', () => {
    const lf = "A.dpr(1) Error: E2003 x\nB.dpr(2) Hint: H2164 y";
    const crlf = "A.dpr(1) Error: E2003 x\r\nB.dpr(2) Hint: H2164 y";
    assert.strictEqual(parseDcc64Diagnostics(lf).length, 2);
    assert.strictEqual(parseDcc64Diagnostics(crlf).length, 2);
  });

  it('deve preservar caminho de unit com pasta e extensão .pas', () => {
    const out = "faturamento\\Unit1.pas(42) Error: E2029 ';' expected but ':' found";
    const [d] = parseDcc64Diagnostics(out);
    assert.strictEqual(d.file, 'faturamento\\Unit1.pas');
    assert.strictEqual(d.line, 42);
    assert.strictEqual(d.code, 'E2029');
  });
});

describe('summarizeDiagnostics', () => {
  const diags = parseDcc64Diagnostics(REAL_OUTPUT);

  it('deve contar por severidade', () => {
    const s = summarizeDiagnostics(diags);
    assert.strictEqual(s.errors, 1);
    assert.strictEqual(s.fatals, 1);
    assert.strictEqual(s.warnings, 1);
    assert.strictEqual(s.hints, 1);
  });

  it('hasBlocking deve ser true quando há erro ou fatal', () => {
    assert.strictEqual(summarizeDiagnostics(diags).hasBlocking, true);
  });

  it('hasBlocking deve ser false quando só há warnings/hints', () => {
    const onlyWarn = parseDcc64Diagnostics(
      "A.dpr(1) Warning: W1035 x\nB.dpr(2) Hint: H2164 y",
    );
    assert.strictEqual(summarizeDiagnostics(onlyWarn).hasBlocking, false);
  });
});

describe('formatDiagnosticsReport', () => {
  it('deve incluir a contagem de erros e warnings no relatório', () => {
    const diags = parseDcc64Diagnostics(REAL_OUTPUT);
    const report = formatDiagnosticsReport(diags);
    // Sem cores para asserção estável.
    const plain = report.replace(/\u001b\[[0-9;]*m/g, '');
    assert.ok(plain.includes('E2003'), 'deve citar o código do erro');
    assert.ok(plain.includes('Probe.dpr:12'), 'deve citar arquivo:linha do erro');
    assert.ok(/2 erro/i.test(plain), 'deve somar erro + fatal como bloqueantes (2)');
  });

  it('deve retornar string vazia quando não há diagnósticos', () => {
    assert.strictEqual(formatDiagnosticsReport([]), '');
  });
});
