import * as fs from 'fs';
import * as path from 'path';

import { BuildOptions } from '../types';
import { banner, printBuildHeader, printSuccess } from '../ui/output';
import { buildCompilerFlags, runBuiltExecutable, runCgrc, runDcc64 } from './compiler';
import { resolveProject } from './project';
import { prepareProjectResources } from './resources';

export async function executeBuild(opts: BuildOptions): Promise<void> {
  banner();

  const { workspaceDir, projectName } = resolveProject(opts.project, opts.repoBase);
  printBuildHeader(opts, projectName, workspaceDir);

  prepareProjectResources(opts, projectName, workspaceDir);

  const oldRes = path.win32.join(workspaceDir, `${projectName}.res`);
  if (fs.existsSync(oldRes)) fs.unlinkSync(oldRes);

  const resFile = await runCgrc(opts, projectName);
  fs.copyFileSync(resFile, path.win32.join(workspaceDir, `${projectName}.res`));

  await runDcc64(opts, projectName, workspaceDir);

  printSuccess(opts.type);

  const { runAfter } = buildCompilerFlags(opts.type);
  if (runAfter) {
    runBuiltExecutable(opts, projectName);
  }
}
