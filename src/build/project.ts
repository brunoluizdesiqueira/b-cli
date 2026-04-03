import * as path from 'path';

export function resolveProject(projectPath: string, repoBase: string): { workspaceDir: string; projectName: string } {
  const fullPath = path.win32.join(repoBase, projectPath);
  const workspaceDir = path.win32.dirname(fullPath) + path.win32.sep;
  const projectName = path.win32.basename(fullPath);

  return { workspaceDir, projectName };
}
