import { BuildOptions } from '../types';
import {
  Dcc64Command,
  ExeCommand,
  getBuiltExecutablePath,
  getDcc64Command,
} from './dcc64-args';

// Re-exporta a API consumida pelo restante da CLI (ex: cli/program.ts),
// mantendo este módulo como o ponto de entrada de inspeção de comandos.
export { getDcc64Command, getBuiltExecutablePath };
export type { Dcc64Command, ExeCommand };

export function printCommands(opts: BuildOptions, projectName: string): void {
  console.log('\n=== COMANDOS PARA TESTES ===\n');

  const dcc64 = getDcc64Command(opts, projectName);
  console.log('--- dcc64 (compilação) ---');
  console.log('EXE:', dcc64.exe);
  console.log('ARGS:');
  dcc64.args.forEach((arg, i) => console.log(`  ${i}: ${arg}`));

  console.log('\n--- exe (execução pós-build) ---');
  const exe = getBuiltExecutablePath(opts, projectName);
  console.log('EXE:', exe.exe);

  console.log('\n=== FIM COMANDOS ===\n');
}
