# bbuilder-cli

CLI para build local de projetos Delphi.

- seleção interativa de projeto, modo e versão
- suporte a `FAST`, `DEBUG` e `RELEASE`
- configuração por arquivo `bbuilder.config.json`
- diagnóstico de ambiente com `doctor`
- validação de comandos com `validate-commands`

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
  "libRoot": "C:\\LibraryDelphiAlexandria",
  "libExternos": "${libRoot}\\Externos\\3.00",
  "libErp": "${libRoot}\\ERP\\${envVersion}",
  "libAlterdata": "${libRoot}\\LibAlterdata\\1.0.0",
  "exeOutputDir": "C:\\Temp\\${envVersion}\\EXE",
  "dcuOutputDir": "C:\\Temp\\${envVersion}\\DCU",
  "stacktraceReportDir": "${userProfile}\\EurekaLog",
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

### Templates de Paths

Os campos de path suportam variáveis que são resolvidas automaticamente:

- `${libRoot}` - caminho base da biblioteca (padrão: `C:\LibraryDelphiAlexandria`)
- `${envVersion}` - versão do ambiente (padrão: `11.03.00`)

Exemplos:
- `"${libRoot}\\Externos\\3.00"` → `"C:\\LibraryDelphiAlexandria\\Externos\\3.00"`
- `"C:\\Temp\\${envVersion}\\EXE"` → `"C:\\Temp\\11.03.00\\EXE"`

Campos que suportam templates:
- `libRoot` - caminho base da biblioteca
- `libExternos` - pasta Externos (derivado de libRoot)
- `libErp` - pasta do ERP (derivado de libRoot e envVersion)
- `libAlterdata` - pasta LibAlterdata (derivado de libRoot)
- `exeOutputDir` - diretório de saída do executável
- `dcuOutputDir` - diretório de saída das units compiladas
- `stacktraceReportDir` - diretório onde a aplicação grava relatórios de crash (ex.: bug reports `.el` do EurekaLog); suporta `${userProfile}` e `${envVersion}`

`dependencyPaths` varia por máquina e deve ser ajustado por usuário.

`stacktraceReportDir` é opcional. Quando definido e usado com `--attach`, o CLI imprime no terminal o stacktrace do relatório de crash mais recente gerado após o início do app. Se ausente, o recurso de impressão de stacktrace fica desabilitado.

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
bbuilder build --type DEBUG --project BimerFaturamento --exe-version 11.3.1
bbuilder build --type FAST --project Bimer
bbuilder build --type RELEASE --project Bimer
```

O `--project` aceita tanto o nome configurado (chave em `projects`) quanto o caminho relativo:

```bash
bbuilder build --type FAST --project BimerFaturamento
bbuilder build --type FAST --project faturamento\BimerFaturamento
```

Atalhos:

```bash
bbuilder fast
bbuilder debug --project Bimer
bbuilder release --project Bimer --exe-version 11.3.1
```

### Modo attach (ver logs e stacktrace no terminal)

Por padrão, nos modos `FAST` e `DEBUG` o CLI inicia o EXE de forma desanexada e libera o terminal imediatamente. Com `--attach`, o EXE é iniciado anexado ao terminal:

```bash
bbuilder build --type DEBUG --project BimerFaturamento --attach
bbuilder debug --project BimerFaturamento --attach
```

No modo attach:

- os logs do app (stdout/stderr) aparecem no terminal em tempo real;
- o CLI aguarda o app encerrar (o terminal fica ocupado até você fechar o app);
- após o encerramento, se `stacktraceReportDir` estiver configurado, o CLI localiza o relatório de crash mais recente gerado nessa execução e imprime o stacktrace formatado (exceção + pilha de chamadas, destacando os frames da aplicação).

O `--attach` só tem efeito em `FAST`/`DEBUG` (que executam o app após o build). `RELEASE` não executa o app.

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

### Validação de Comandos

Para verificar quais comandos serão executados sem rodar o build:

```bash
bbuilder validate-commands --type FAST
bbuilder validate-commands --type DEBUG
bbuilder validate-commands --type RELEASE
```

Opções:
- `-t, --type` - modo de build (FAST, DEBUG, RELEASE)
- `-p, --project` - caminho do projeto
- `-v, --version` - versão do exe

Esta ferramenta é útil para:
- depuração de problemas de build
- geração de testes unitários
- verificação de paths e argumentos

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

Verificar comandos que serão executados:

```bash
bbuilder validate-commands --type DEBUG
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
