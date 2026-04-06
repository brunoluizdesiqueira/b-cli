import * as fs from 'fs';
import * as path from 'path';

import { BuildOptions } from '../types';
import { banner, printBuildHeader, printSuccess, withStep } from '../ui/output';
import { buildCompilerFlags, ensureDelphiEnvironment, runBuiltExecutable, runCgrc, runDcc64 } from './compiler';
import { resolveProject } from './project';
import { prepareProjectResources } from './resources';

export async function executeBuild(opts: BuildOptions): Promise<void> {
  const totalStages = 5;

  banner();

  const { workspaceDir, projectName } = resolveProject(opts.project, opts.repoBase);
  printBuildHeader(opts, projectName, workspaceDir);

  await withStep(1, totalStages, 'Carregando ambiente do Delphi', () => ensureDelphiEnvironment(opts.delphiDir));

  await withStep(2, totalStages, 'Preparando versao, manifesto e recursos', () => {
    prepareProjectResources(opts, projectName, workspaceDir);
  });

  const oldRes = path.win32.join(workspaceDir, `${projectName}.res`);
  if (fs.existsSync(oldRes)) fs.unlinkSync(oldRes);

  const resFile = await withStep(
    3,
    totalStages,
    'Compilando recursos nativos',
    () => runCgrc(opts, projectName)
  );

  await withStep(4, totalStages, 'Sincronizando recurso final no projeto', () => {
    fs.copyFileSync(resFile, path.win32.join(workspaceDir, `${projectName}.res`));
  });

  await withStep(
    5,
    totalStages,
    `Compilando projeto Delphi (${opts.type})`,
    () => runDcc64(opts, projectName, workspaceDir)
  );

  printSuccess(opts.type);

  const { runAfter } = buildCompilerFlags(opts.type);
  if (runAfter) {
    runBuiltExecutable(opts, projectName);
  }
}
