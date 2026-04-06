# bbuilder-cli

CLI para build local de projetos Delphi do Bimer.

Substitui o `build_local.bat` com:
- seleção interativa de projeto, modo e versão
- suporte a `FAST`, `DEBUG` e `RELEASE`
- configuração por arquivo `bbuilder.config.json`
- diagnóstico de ambiente com `doctor`

## Requisitos

- Node.js 18+
- Windows
- Delphi instalado
- bibliotecas do projeto disponíveis na máquina

## Instalação

```bash
npm install -g @brunoluizdesiqueira/bbuilder-cli
```

Depois confirme:

```bash
bbuilder --version
```

## Configuração

Crie a configuração inicial:

```bash
bbuilder config init
```

Ou use um arquivo manual como este:

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
    "Bimer": "Bimer"
  }
}
```

`dependencyPaths` varia por máquina e deve ser ajustado por usuário.

## Resolução da Configuração

Ordem de prioridade:

1. `--config <caminho>`
2. variável de ambiente `BBUILDER_CONFIG`
3. `bbuilder.config.json` no diretório atual
4. `bimer.config.json` no diretório atual, por compatibilidade
5. arquivo global do usuário

No Windows, o arquivo global padrão fica em:

```text
%APPDATA%\bbuilder-cli\bbuilder.config.json
```

Exemplos:

```bash
bbuilder --config C:\configs\bbuilder.config.json build
```

```bat
set BBUILDER_CONFIG=C:\configs\bbuilder.config.json
bbuilder build
```

```powershell
$env:BBUILDER_CONFIG="C:\configs\bbuilder.config.json"
bbuilder build
```

## Uso

Modo interativo:

```bash
bbuilder
```

Build direto:

```bash
bbuilder build --type DEBUG --project BimerFaturamento --version 11.3.1
bbuilder build --type FAST --project Bimer
bbuilder build --type RELEASE --project Bimer
```

Atalhos:

```bash
bbuilder fast
bbuilder debug --project Bimer
bbuilder release --project Bimer --version 11.3.1
```

Projetos:

```bash
bbuilder project list
bbuilder project add
bbuilder project remove
bbuilder project remove --name Bimer
```

Configuração:

```bash
bbuilder config init
bbuilder config show
bbuilder config validate
bbuilder doctor
```

## Observações de Uso

- o build mostra etapas com tempo decorrido
- `cgrc` e `dcc64` escrevem diretamente no terminal durante a compilação
- no PowerShell, a saída do compilador pode ser menos verbosa que no `cmd`, mesmo com o build funcionando corretamente

Se o PowerShell bloquear `npm` ou `bbuilder`, ajuste a policy do usuário:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Troubleshooting

Validar ambiente:

```bash
bbuilder doctor
```

Validar configuração:

```bash
bbuilder config validate
```

Erro `Unit not found: 'System'` normalmente indica problema em:
- `delphiDir`
- `dependencyPaths`
- path `...\lib\Win64\release` ausente na configuração

## Publicação

Para usuários, nada além de instalar o pacote é necessário.

Para mantenedores, o fluxo é:
- criar changeset
- abrir PR
- mergear na `main`
- mergear a PR automática de release
- publicação no npm ocorre via GitHub Actions

## Licença

ISC
