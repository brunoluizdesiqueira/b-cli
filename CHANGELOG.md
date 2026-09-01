# @brunoluizdesiqueira/bbuilder-cli

## 2.1.0

### Minor Changes

- 182795d: Adicionar parser de diagnósticos do compilador dcc64. A saída do compilador agora é capturada (com streaming ao vivo preservado no terminal via tee) e, ao final do build, é apresentado um resumo estruturado de erros, warnings e hints — cada um com arquivo, linha, código (ex: `E2003`) e mensagem. Erros/fatais são destacados. Quando não há diagnósticos, nada extra é impresso. Em caso de falha, o resumo é exibido antes de encerrar, substituindo a antiga mensagem genérica "verifique os logs acima".
- 47c0224: Adicionar a flag `--show-warnings` aos comandos de build (`build`, `fast`, `debug`, `release`, `validate-commands`). Por padrão o compilador suprime hints e warnings (`-H- -W-`) para manter a saída limpa; com `--show-warnings` esses supressores globais são omitidos, fazendo o dcc64 emitir hints/warnings que o parser de diagnósticos passa a reportar no resumo (com arquivo, linha e código). Os supressores específicos de ruído de plataforma (`-W-SYMBOL_PLATFORM`, `-W-UNIT_PLATFORM`, etc.) são mantidos mesmo com a flag ativa.

### Patch Changes

- eb2f537: Unificar a geração dos comandos do compilador dcc64 em uma fonte única (`src/build/dcc64-args.ts`), consumida tanto pelo executor de build (`compiler.ts`) quanto pelo inspetor de comandos (`validate-commands.ts`). Elimina a duplicação que permitia divergência silenciosa entre "o que é inspecionado" e "o que é executado". As diretivas de compilação (incluindo as de DEBUG: `-$D+ -$L+ -$Y+ -$O- -V -VR`) permanecem idênticas, com testes que travam cada uma.

  Corrigir o terminal que ficava preso após o build FAST/DEBUG: a execução pós-build do EXE agora usa `child_process.spawn` desanexado (em vez de `execa`), liberando o console imediatamente sem esperar o EXE (ou a sessão de debug anexada a ele) ser encerrado.

- 0304594: Renomear a flag de versão do EXE de `--version` para `--exe-version` em todos os comandos de build (build, fast, debug, release, validate-commands). A flag `--version` conflitava com a flag interna do Commander e não funcionava via linha de comando. O default agora usa o envVersion do config.

## 2.0.1

### Patch Changes

- d8c35de: Usar envVersion do config como valor default no prompt de versão do EXE, em vez de valor hardcoded.

## 2.0.0

### Major Changes

- 7c84809: Resolver templates ${envVersion} e ${libRoot} dentro do dependencyPaths do config. Antes, paths com placeholders eram usados literalmente sem substituição.

## 1.0.24

### Patch Changes

- 9c120d4: resolve externos path

## 1.0.23

### Patch Changes

- 9783eb1: refactor end unit tests

## 1.0.22

### Patch Changes

- 9f502e3: ajust print build header

## 1.0.21

### Patch Changes

- 46aa79d: change print succeess

## 1.0.20

### Patch Changes

- 6c9bdb0: change banner

## 1.0.19

### Patch Changes

- c94d09c: md file ajust

## 1.0.18

### Patch Changes

- 411e2c4: refactor readme file

## 1.0.17

### Patch Changes

- 7f176ac: remove progress bar

## 1.0.16

### Patch Changes

- ca61c56: fix: rvars

## 1.0.15

### Patch Changes

- afa0017: fix: progress bar and warn

## 1.0.14

### Patch Changes

- f2fccf0: fix: progress bar

## 1.0.13

### Patch Changes

- 526c7b9: fix: progress bar

## 1.0.12

### Patch Changes

- ff61245: fix: progress bar

## 1.0.11

### Patch Changes

- 0adfd47: progress bar added

## 1.0.10

### Patch Changes

- 8332066: fix rsvars exec

## 1.0.9

### Patch Changes

- 3be78f1: fix paths

## 1.0.8

### Patch Changes

- 5fe414b: adjust support rsvars

## 1.0.7

### Patch Changes

- 5fca930: add rsvars on cli

## 1.0.6

### Patch Changes

- 38ae819: add spawn support

## 1.0.5

### Patch Changes

- 8096ed2: resolve verbatim args to cmd

## 1.0.4

### Patch Changes

- a417ae1: change compiler at cdm

## 1.0.3

### Patch Changes

- 5e28604: fix path windows environment

## 1.0.2

### Patch Changes

- 1109408: Add environment diagnostics with `bbuilder doctor`, configuration validation with `bbuilder config validate`, and stronger terminal help examples. Also prepare automated CI/release workflow using Changesets.
- 1109408: Introduce CI/CD workflow
- cd74655: update readme file
- 1f9e098: 2
- d5b84c8: Adds the functionality to remove projects.
