---
"@brunoluizdesiqueira/bbuilder-cli": minor
---

Adicionar parser de diagnósticos do compilador dcc64. A saída do compilador agora é capturada (com streaming ao vivo preservado no terminal via tee) e, ao final do build, é apresentado um resumo estruturado de erros, warnings e hints — cada um com arquivo, linha, código (ex: `E2003`) e mensagem. Erros/fatais são destacados. Quando não há diagnósticos, nada extra é impresso. Em caso de falha, o resumo é exibido antes de encerrar, substituindo a antiga mensagem genérica "verifique os logs acima".
