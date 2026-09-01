---
"@brunoluizdesiqueira/bbuilder-cli": minor
---

Adicionar a flag `--show-warnings` aos comandos de build (`build`, `fast`, `debug`, `release`, `validate-commands`). Por padrão o compilador suprime hints e warnings (`-H- -W-`) para manter a saída limpa; com `--show-warnings` esses supressores globais são omitidos, fazendo o dcc64 emitir hints/warnings que o parser de diagnósticos passa a reportar no resumo (com arquivo, linha e código). Os supressores específicos de ruído de plataforma (`-W-SYMBOL_PLATFORM`, `-W-UNIT_PLATFORM`, etc.) são mantidos mesmo com a flag ativa.
