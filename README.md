# bbuilder-cli

CLI em Node.js/TypeScript que substitui o `build_local.bat` com interface interativa e suporte a flags diretas.

---

## Instalação

```bash
# Desenvolvimento local
npm install
npm run build
npm link        # disponibiliza o comando 'bbuilder' globalmente
```

```bash
# Instalação via npm
npm install -g @brunoluizdesiqueira/bbuilder-cli
```

```bash
# Publicação
npm publish --access public
```

## Publicação

### Publicação manual inicial

Use esse fluxo para a primeira publicação ou para publicar manualmente uma versão:

1. Faça login no npm:

```bash
npm login
```

2. Valide o pacote localmente:

```bash
npm run build
npm pack --dry-run
```

3. Publique:

```bash
npm publish --access public
```

Se a versão atual do `package.json` já tiver sido publicada, gere uma nova versão antes:

```bash
npm version patch --no-git-tag-version
npm publish --access public
```

### Configurar publicação automática

Depois da primeira publicação manual, configure o npm para confiar no workflow do GitHub Actions.

No npm:

1. abra a página do pacote `@brunoluizdesiqueira/bbuilder-cli`
2. vá em `Settings`
3. abra `Trusted publishing`
4. adicione um publisher do tipo `GitHub Actions`
5. configure:
   - repositório: `brunoluizdesiqueira/b-cli`
   - workflow: `release.yml`

Na opção **Publishing access**, use:

- `Require two-factor authentication or a granular access token with bypass 2fa enabled`

Evite para esse fluxo:

- `Require two-factor authentication and disallow tokens`

### Publicação automática com Changesets

Depois do Trusted Publisher configurado, o fluxo recomendado fica assim:

1. criar uma changeset para cada mudança publicada:

```bash
npm run changeset
```

2. fazer commit da changeset junto com o código
3. abrir PR e fazer merge na `main`
4. o workflow `Release` abre ou atualiza uma PR de release
5. ao mergear a PR de release, o npm é publicado automaticamente

Comandos locais úteis:

```bash
npm run changeset
npm run version-packages
npm run release
```

## CI/CD

O repositório agora está preparado com GitHub Actions:

- `CI`: roda em `push` e `pull_request`, executando `npm ci`, `tsc`, `build` e `npm pack --dry-run`
- `Release`: usa `changesets` para abrir uma PR de release com bump de versão e changelog; quando essa PR entra na `main`, o pacote é publicado no npm

Ou use direto sem instalar globalmente:
```bash
npx ts-node src/index.ts build
```

---

## Uso

### Modo interativo (sem argumentos)
```bash
bbuilder
```
Exibe menus para escolher: modo de build → projeto → versão.

### Comando `build` com flags opcionais
```bash
bbuilder build                                       # interativo completo
bbuilder build --type DEBUG                          # escolhe projeto e versão interativamente
bbuilder build --type FAST --project faturamento\BimerFaturamento
bbuilder build --type RELEASE --project Bimer --version 11.3.1
```

### Atalhos diretos por modo
```bash
bbuilder fast                                        # interativo para projeto/versão
bbuilder debug --project Bimer
bbuilder release --project Bimer --version 11.3.1
```

### Gerenciamento de projetos
```bash
bbuilder project list   # lista projetos configurados
bbuilder project add    # adiciona novo projeto (interativo)
```

### Configuração do ambiente
```bash
bbuilder config init    # assistente para criar bbuilder.config.json
bbuilder config show    # exibe configuração atual
bbuilder config validate # valida a estrutura do arquivo de configuração
bbuilder doctor         # diagnostica ambiente, config e paths
```

---

## Configuração (`bbuilder.config.json`)

Prioridade de resolução da configuração:

1. `bbuilder --config <caminho>`
2. Variável de ambiente `BBUILDER_CONFIG`
3. `bbuilder.config.json` no diretório atual
4. `bimer.config.json` no diretório atual, por compatibilidade
5. Arquivo global do usuário

No Windows, o arquivo global fica em `%APPDATA%\bbuilder-cli\bbuilder.config.json`.

Crie com `bbuilder config init`, ou manualmente:

```json
{
  "repoBase": "C:\\git\\bimer",
  "delphiDir": "C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0",
  "envVersion": "11.03.00",
  "libRoot": "C:\\LibraryDelphiAlexandria\\Externos\\3.00",
  "libErp": "C:\\LibraryDelphiAlexandria\\ERP\\11.03.00",
  "libAlterdata": "C:\\LibraryDelphiAlexandria\\LibAlterdata\\1.0.0",
  "dependencyPaths": [
    "C:\\git\\bimer\\dependencies",
    "C:\\Program Files (x86)\\Embarcadero\\Studio\\22.0\\lib\\Win64\\release",
    "C:\\LibraryDelphiAlexandria\\Externos\\3.00\\sgcWebSockets\\Win64",
    "C:\\LibraryDelphiAlexandria\\ERP\\11.03.00\\Win64"
  ],
  "projects": {
    "BimerFaturamento": "faturamento\\BimerFaturamento",
    "Bimer": "Bimer",
    "LiberadorEstoque": "geral\\gerenteeletronico.jobs.liberadorestoque\\LiberadorEstoque",
    "BimerEstoque": "estoque\\BimerEstoque"
  }
}
```

`dependencyPaths` deve ser ajustado no `bbuilder.config.json`, porque esses caminhos podem variar entre usuários e máquinas.

`projects` agora usa o formato `nome amigável: caminho real do projeto`, para a CLI exibir nomes humanizados sem perder a referência correta de compilação.

Se o arquivo não existir, os valores padrão acima são usados automaticamente. Ao rodar `bbuilder config init`, a CLI gera um `dependencyPaths` inicial com base nos diretórios informados.

### Como usar configs locais

O pacote é instalado normalmente, e a configuração é informada na execução, não na instalação.

Instalação global:

```bash
npm install -g @brunoluizdesiqueira/bbuilder-cli
```

Usando um arquivo de config local explícito:

```bash
bbuilder --config C:\configs\bbuilder.config.json build
```

Usando variável de ambiente no Windows CMD:

```bat
set BBUILDER_CONFIG=C:\configs\bbuilder.config.json
bbuilder build
```

Usando variável de ambiente no PowerShell:

```powershell
$env:BBUILDER_CONFIG="C:\configs\bbuilder.config.json"
bbuilder build
```

Usando config local no diretório atual:

Se existir um `bbuilder.config.json` na pasta onde o comando é executado, a CLI usa esse arquivo automaticamente.

Para verificar qual arquivo está sendo usado:

```bash
bbuilder config show
```

Exemplos:

```bash
bbuilder --config C:\configs\bbuilder.config.json build
```

```bash
set BBUILDER_CONFIG=C:\configs\bbuilder.config.json
bbuilder config show
```

---

## Integração com VSCode (`tasks.json`)

Substitua o `tasks.json` atual por este (sem mais menus do VSCode, a CLI cuida de tudo):

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Bimer: FAST + Run",
      "type": "shell",
      "command": "bbuilder fast",
      "group": "build",
      "presentation": { "reveal": "always", "focus": true, "panel": "dedicated", "clear": true },
      "problemMatcher": {
        "owner": "delphi",
        "fileLocation": ["autoDetect", "${workspaceFolder}"],
        "pattern": {
          "regexp": "^(.*?)\\s*\\((\\d+)\\)(?:\\s+|:\\s*)(Fatal|Error|Warning|Hint|error|fatal):\\s+(.*)$",
          "file": 1, "line": 2, "severity": 3, "message": 4
        }
      }
    },
    {
      "label": "Bimer: DEBUG + Run",
      "type": "shell",
      "command": "bbuilder debug",
      "group": "build",
      "presentation": { "reveal": "always", "focus": true, "panel": "dedicated", "clear": true },
      "problemMatcher": {
        "owner": "delphi",
        "fileLocation": ["autoDetect", "${workspaceFolder}"],
        "pattern": {
          "regexp": "^(.*?)\\s*\\((\\d+)\\)(?:\\s+|:\\s*)(Fatal|Error|Warning|Hint|error|fatal):\\s+(.*)$",
          "file": 1, "line": 2, "severity": 3, "message": 4
        }
      }
    },
    {
      "label": "Bimer: RELEASE",
      "type": "shell",
      "command": "bbuilder release",
      "group": "build",
      "presentation": { "reveal": "always", "focus": true, "panel": "dedicated", "clear": true },
      "problemMatcher": {
        "owner": "delphi",
        "fileLocation": ["autoDetect", "${workspaceFolder}"],
        "pattern": {
          "regexp": "^(.*?)\\s*\\((\\d+)\\)(?:\\s+|:\\s*)(Fatal|Error|Warning|Hint|error|fatal):\\s+(.*)$",
          "file": 1, "line": 2, "severity": 3, "message": 4
        }
      }
    }
  ]
}
```

E nos keybindings, nada muda — os atalhos continuam os mesmos.

---

## Estrutura do Projeto

```
bbuilder-cli/
├── .changeset/
│   ├── config.json
│   └── *.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── src/
│   ├── build/
│   │   ├── compiler.ts
│   │   ├── execute.ts
│   │   ├── project.ts
│   │   └── resources.ts
│   ├── cli/
│   │   └── program.ts
│   ├── config/
│   │   ├── config.ts
│   │   └── validate.ts
│   ├── diagnostics/
│   │   └── doctor.ts
│   ├── ui/
│   │   ├── output.ts
│   │   └── prompts.ts
│   ├── index.ts
│   └── types.ts
├── files/
│   ├── build_local.bat
│   ├── tasks.json
│   └── ...
├── bbuilder.config.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
├── LICENSE
└── README.md
```

## Stack

| Lib | Por quê |
|---|---|
| **commander** | Parsing de comandos e flags |
| **inquirer** | Menus interativos com setas |
| **chalk** | Cores ANSI no terminal |
| **execa** | Spawn de processos externos (CGRC, DCC64) |
| **typescript** | Tipagem, autocomplete, menos bugs |
