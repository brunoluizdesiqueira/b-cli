import * as fs from 'fs';
import * as path from 'path';

import { BuildOptions } from '../types';
import { banner, printBuildHeader, printSuccess, withProgress } from '../ui/output';
import { buildCompilerFlags, runBuiltExecutable, runCgrc, runDcc64 } from './compiler';
import { resolveProject } from './project';
import { prepareProjectResources } from './resources';

export async function executeBuild(opts: BuildOptions): Promise<void> {
  const totalStages = 4;

  banner();

  const { workspaceDir, projectName } = resolveProject(opts.project, opts.repoBase);
  printBuildHeader(opts, projectName, workspaceDir);

  await withProgress(1, totalStages, 'Preparando versao, manifesto e recursos', () => {
    prepareProjectResources(opts, projectName, workspaceDir);
  });

  const oldRes = path.win32.join(workspaceDir, `${projectName}.res`);
  if (fs.existsSync(oldRes)) fs.unlinkSync(oldRes);

  const resFile = await withProgress(2, totalStages, 'Compilando recursos nativos', () => runCgrc(opts, projectName));

  await withProgress(3, totalStages, 'Sincronizando recurso final no projeto', () => {
    fs.copyFileSync(resFile, path.win32.join(workspaceDir, `${projectName}.res`));
  });

  await withProgress(
    4,
    totalStages,
    `Compilando projeto Delphi (${opts.type})`,
    () => runDcc64(opts, projectName, workspaceDir),
    { streamingOutput: true }
  );

  printSuccess(opts.type);

  const { runAfter } = buildCompilerFlags(opts.type);
  if (runAfter) {
    runBuiltExecutable(opts, projectName);
  }
}
