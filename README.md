# bimer-cli

CLI em Node.js/TypeScript que substitui o `build_local.bat` com interface interativa e suporte a flags diretas.

---

## Instalação

```bash
# Na raiz do repositório (C:\git\bimer)
npm install
npm run build
npm link        # disponibiliza o comando 'bimer' globalmente
```

Ou use direto sem instalar globalmente:
```bash
npx ts-node src/index.ts build
```

---

## Uso

### Modo interativo (sem argumentos)
```bash
bimer
```
Exibe menus para escolher: modo de build → projeto → versão.

### Comando `build` com flags opcionais
```bash
bimer build                                          # interativo completo
bimer build --type DEBUG                             # escolhe projeto e versão interativamente
bimer build --type FAST --project faturamento\BimerFaturamento
bimer build --type RELEASE --project Bimer --version 11.3.1
```

### Atalhos diretos por modo
```bash
bimer fast                                           # interativo para projeto/versão
bimer debug --project Bimer
bimer release --project Bimer --version 11.3.1
```

### Gerenciamento de projetos
```bash
bimer project list      # lista projetos configurados
bimer project add       # adiciona novo projeto (interativo)
```

### Configuração do ambiente
```bash
bimer config init       # assistente para criar bimer.config.json
bimer config show       # exibe configuração atual
```

---

## Configuração (`bimer.config.json`)

Crie na raiz do projeto com `bimer config init`, ou manualmente:

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

`dependencyPaths` deve ser ajustado no `bimer.config.json`, porque esses caminhos podem variar entre usuários e máquinas.

`projects` agora usa o formato `nome amigável: caminho real do projeto`, para a CLI exibir nomes humanizados sem perder a referência correta de compilação.

Se o arquivo não existir, os valores padrão acima são usados automaticamente. Ao rodar `bimer config init`, a CLI gera um `dependencyPaths` inicial com base nos diretórios informados.

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
      "command": "bimer fast",
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
      "command": "bimer debug",
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
      "command": "bimer release",
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
bimer-cli/
├── src/
│   └── index.ts        ← toda a lógica da CLI
├── package.json
├── tsconfig.json
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
