import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { BuildOptions } from '../types';
import { fatal, step } from '../ui/output';

function parseVersionParts(version: string): [number, number, number, number] {
  const normalized = version.trim().replace(/\.+$/, '');
  const parts = normalized.split('.');

  return [
    parts[0] ? Number(parts[0]) : 0,
    parts[1] ? Number(parts[1]) : 0,
    parts[2] ? Number(parts[2]) : 0,
    parts[3] ? Number(parts[3]) : 0,
  ];
}

function resolveVersionInfo(content: string, version?: string): { content: string; fullVersion: string; parts: [number, number, number, number] } {
  if (version && version.trim()) {
    const [major, minor, release, build] = parseVersionParts(version);
    const fullVersion = `${major}.${minor}.${release}.${build}`;
    const nextContent = content
      .replace(/(<VerInfo_MajorVer>)[^<]*(<\/VerInfo_MajorVer>)/, `$1${major}$2`)
      .replace(/(<VerInfo_MinorVer>)[^<]*(<\/VerInfo_MinorVer>)/, `$1${minor}$2`)
      .replace(/(<VerInfo_Release>)[^<]*(<\/VerInfo_Release>)/, `$1${release}$2`)
      .replace(/(<VerInfo_Build>)[^<]*(<\/VerInfo_Build>)/, `$1${build}$2`)
      .replace(/(FileVersion=)[^;<]*/g, `$1${fullVersion}`)
      .replace(/(ProductVersion=)[^;<]*/g, `$1${fullVersion}`);

    return { content: nextContent, fullVersion, parts: [major, minor, release, build] };
  }

  const major = Number(content.match(/<VerInfo_MajorVer>([^<]*)<\/VerInfo_MajorVer>/)?.[1] || 1);
  const minor = Number(content.match(/<VerInfo_MinorVer>([^<]*)<\/VerInfo_MinorVer>/)?.[1] || 0);
  const release = Number(content.match(/<VerInfo_Release>([^<]*)<\/VerInfo_Release>/)?.[1] || 0);
  const build = Number(content.match(/<VerInfo_Build>([^<]*)<\/VerInfo_Build>/)?.[1] || 0);
  const fullVersion = `${major}.${minor}.${release}.${build}`;

  return { content, fullVersion, parts: [major, minor, release, build] };
}

function resolveMainIcon(content: string, delphiDir: string, projectDir: string, projectName: string): string {
  const iconPathRaw = (content.match(/<Icon_MainIcon>([^<]*)<\/Icon_MainIcon>/)?.[1] || '').trim();
  let resolvedIconPath = iconPathRaw.replace(/\$\(BDS\)/g, delphiDir);

  if (resolvedIconPath && !path.win32.isAbsolute(resolvedIconPath)) {
    resolvedIconPath = path.win32.join(projectDir, resolvedIconPath);
  }

  const projectIcon = path.win32.join(projectDir, `${projectName}_Icon.ico`);
  const fallbackIcon = path.win32.join(delphiDir, 'bin', 'delphi_PROJECTICON.ico');

  if (resolvedIconPath && fs.existsSync(resolvedIconPath)) {
    return resolvedIconPath;
  }
  if (fs.existsSync(projectIcon)) {
    return projectIcon;
  }
  return fallbackIcon;
}

function buildManifestContent(projectName: string, fullVersion: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">',
    `  <assemblyIdentity type="win32" name="${projectName}" version="${fullVersion}" processorArchitecture="*"/>`,
    '  <dependency>',
    '    <dependentAssembly>',
    '      <assemblyIdentity type="win32" name="Microsoft.Windows.Common-Controls" version="6.0.0.0" publicKeyToken="6595b64144ccf1df" language="*" processorArchitecture="*"/>',
    '    </dependentAssembly>',
    '  </dependency>',
    '  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">',
    '    <security>',
    '      <requestedPrivileges>',
    '        <requestedExecutionLevel level="asInvoker" uiAccess="false"/>',
    '      </requestedPrivileges>',
    '    </security>',
    '  </trustInfo>',
    '</assembly>',
  ].join('\r\n');
}

function buildVrcContent(projectName: string, fullVersion: string, parts: [number, number, number, number], manifestPath: string, iconPath: string): string {
  const [major, minor, release, build] = parts;
  const lines: string[] = [];

  if (iconPath) {
    lines.push(`MAINICON ICON "${iconPath.replace(/\\/g, '\\\\')}"`);
  }

  lines.push(`1 24 "${manifestPath.replace(/\\/g, '\\\\')}"`);
  lines.push('1 VERSIONINFO');
  lines.push(`FILEVERSION ${major},${minor},${release},${build}`);
  lines.push(`PRODUCTVERSION ${major},${minor},${release},${build}`);
  lines.push('FILEFLAGSMASK 0x3FL');
  lines.push('FILEFLAGS 0x00L');
  lines.push('FILEOS 0x40004L');
  lines.push('FILETYPE 0x1L');
  lines.push('FILESUBTYPE 0x0L');
  lines.push('BEGIN');
  lines.push('    BLOCK "StringFileInfo"');
  lines.push('    BEGIN');
  lines.push('        BLOCK "040904E4"');
  lines.push('        BEGIN');
  lines.push('            VALUE "CompanyName", "\\0"');
  lines.push(`            VALUE "FileDescription", "${projectName}\\0"`);
  lines.push(`            VALUE "FileVersion", "${fullVersion}\\0"`);
  lines.push('            VALUE "InternalName", "\\0"');
  lines.push('            VALUE "LegalCopyright", "\\0"');
  lines.push(`            VALUE "OriginalFilename", "${projectName}.exe\\0"`);
  lines.push(`            VALUE "ProductName", "${projectName}\\0"`);
  lines.push(`            VALUE "ProductVersion", "${fullVersion}\\0"`);
  lines.push('        END');
  lines.push('    END');
  lines.push('    BLOCK "VarFileInfo"');
  lines.push('    BEGIN');
  lines.push('        VALUE "Translation", 0x0409, 1252');
  lines.push('    END');
  lines.push('END');

  return lines.join('\r\n');
}

export function prepareProjectResources(opts: BuildOptions, projectName: string, workspaceDir: string): void {
  const dproj = path.win32.join(workspaceDir, `${projectName}.dproj`);
  const tempDir = path.join(os.tmpdir(), `BimerBuild_${projectName}`);
  const manifestFile = path.join(tempDir, `${projectName}.manifest`);
  const vrcFile = path.join(tempDir, `${projectName}.vrc`);

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  if (!fs.existsSync(dproj)) {
    fatal(`Arquivo de projeto não encontrado: ${dproj}`);
  }

  if (opts.version) {
    step(`Injetando versão ${opts.version} no projeto...`);
  } else {
    step('Nenhuma versão informada. Lendo atual do projeto...');
  }

  try {
    const projectContent = fs.readFileSync(dproj, 'utf-8');
    const { content: updatedContent, fullVersion, parts } = resolveVersionInfo(projectContent, opts.version);

    if (updatedContent !== projectContent) {
      fs.writeFileSync(dproj, updatedContent, 'utf-8');
    }

    const iconPath = resolveMainIcon(updatedContent, opts.delphiDir, workspaceDir, projectName);
    const manifestContent = buildManifestContent(projectName, fullVersion);
    const vrcContent = buildVrcContent(projectName, fullVersion, parts, manifestFile, iconPath);

    fs.writeFileSync(manifestFile, manifestContent, 'ascii');
    fs.writeFileSync(vrcFile, vrcContent, 'ascii');
  } catch {
    fatal('Falha ao preparar versão, manifesto e recursos do projeto.');
  }
}
