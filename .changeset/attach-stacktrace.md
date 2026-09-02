---
"@brunoluizdesiqueira/bbuilder-cli": minor
---

Adicionar a flag `--attach` aos comandos de build (`build`, `fast`, `debug`, `release`). Por padrão, nos modos FAST/DEBUG o EXE é iniciado desanexado e o terminal é liberado imediatamente; com `--attach` o EXE roda anexado ao terminal (stdio herdado), exibindo logs em tempo real, e o CLI aguarda o app encerrar. Após o encerramento, se `stacktraceReportDir` estiver configurado, o CLI localiza o relatório de crash mais recente gerado nessa execução (formato bug report `.el` do EurekaLog, UTF-16) e imprime o stacktrace formatado — exceção e pilha de chamadas, destacando os frames da aplicação. O parser é genérico (reconhece a estrutura por numeração de campos e tabela de pilha, independente do idioma do relatório) e cai para um dump bruto quando o formato não é reconhecido.

Inclui o novo campo de configuração opcional `stacktraceReportDir` (suporta os templates `${userProfile}` e `${envVersion}`; default `${userProfile}\EurekaLog`).

Correções relacionadas:
- `--project` passa a aceitar tanto o nome configurado (chave em `projects`) quanto o caminho relativo; antes o nome era usado como caminho e o `.dproj` não era encontrado.
- Builds em ambiente não-interativo (sem TTY) não quebram mais com `ERR_USE_AFTER_CLOSE`: quando não há terminal interativo, os valores default das perguntas são aplicados em vez de abrir prompt.
- `validate-commands` passa a derivar o nome do projeto da mesma fonte que o build real (caminho resolvido), garantindo que os comandos inspecionados sejam idênticos aos executados mesmo quando a chave do projeto difere do basename do caminho.
- No modo `--attach`, falha ao iniciar o EXE (ex.: inexistente) agora exibe uma mensagem clara em vez de silenciar.
