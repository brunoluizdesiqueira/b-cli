---
"@brunoluizdesiqueira/bbuilder-cli": patch
---

Unificar a geração dos comandos do compilador dcc64 em uma fonte única (`src/build/dcc64-args.ts`), consumida tanto pelo executor de build (`compiler.ts`) quanto pelo inspetor de comandos (`validate-commands.ts`). Elimina a duplicação que permitia divergência silenciosa entre "o que é inspecionado" e "o que é executado". As diretivas de compilação (incluindo as de DEBUG: `-$D+ -$L+ -$Y+ -$O- -V -VR`) permanecem idênticas, com testes que travam cada uma.

Corrigir o terminal que ficava preso após o build FAST/DEBUG: a execução pós-build do EXE agora usa `child_process.spawn` desanexado (em vez de `execa`), liberando o console imediatamente sem esperar o EXE (ou a sessão de debug anexada a ele) ser encerrado.
