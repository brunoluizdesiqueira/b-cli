---
"@brunoluizdesiqueira/bbuilder-cli": patch
---

Renomear a flag de versão do EXE de `--version` para `--exe-version` em todos os comandos de build (build, fast, debug, release, validate-commands). A flag `--version` conflitava com a flag interna do Commander e não funcionava via linha de comando. O default agora usa o envVersion do config.
