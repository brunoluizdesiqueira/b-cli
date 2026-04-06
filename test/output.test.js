const test = require('node:test');
const assert = require('node:assert/strict');

const output = require('../dist/ui/output.js');
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

function stripAnsi(value) {
  return value.replace(ANSI_PATTERN, '');
}

test('formatElapsedMs formats minutes and seconds', () => {
  assert.equal(output.formatElapsedMs(0), '00:00');
  assert.equal(output.formatElapsedMs(999), '00:00');
  assert.equal(output.formatElapsedMs(1000), '00:01');
  assert.equal(output.formatElapsedMs(61000), '01:01');
});

test('withStep logs start and success', async () => {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => {
    lines.push(args.join(' '));
  };

  try {
    const result = await output.withStep(2, 5, 'Executando etapa de teste', async () => 'ok');
    assert.equal(result, 'ok');
  } finally {
    console.log = originalLog;
  }

  assert.equal(lines.length, 2);
  assert.match(stripAnsi(lines[0]), /\[\*\].*\[2\/5\] Executando etapa de teste/);
  assert.match(stripAnsi(lines[1]), /OK .*Executando etapa de teste.*\(\d{2}:\d{2}\)/);
});

test('withStep logs failure and rethrows', async () => {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => {
    lines.push(args.join(' '));
  };

  try {
    await assert.rejects(
      () => output.withStep(3, 5, 'Etapa com erro', async () => {
        throw new Error('boom');
      }),
      /boom/
    );
  } finally {
    console.log = originalLog;
  }

  assert.equal(lines.length, 2);
  assert.match(stripAnsi(lines[0]), /\[\*\].*\[3\/5\] Etapa com erro/);
  assert.match(stripAnsi(lines[1]), /FAIL .*Etapa com erro.*\(\d{2}:\d{2}\)/);
});
