# ?? Setup de Build Delphi no VS Code (Projeto Bimer)

![Delphi](https://img.shields.io/badge/Delphi-11.02.03-red.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-Integration-blue.svg)
![Build](https://img.shields.io/badge/Build-Automated-success.svg)

Este guia documenta o ambiente de compilação local do ERP Bimer (e seus módulos) diretamente pelo Visual Studio Code. 

Essa pipeline foi construída para substituir o uso da IDE completa no dia a dia, oferecendo builds extremamente rápidos, injeção de versão automatizada e travas de segurança rigorosas contra erros do Windows (Erro Lado a Lado) e corrupção de ícones (`EResNotFound`).

---

## ?? Estrutura de Arquivos e Diretórios

Para que a automação funcione corretamente, o repositório deve manter a seguinte estrutura raiz:

    C:\git\bimer\                    <-- Raiz do seu repositório
     ?
     ??? build_local.bat             <-- Script principal de compilação
     ??? update_version.ps1          <-- Motor de injeção de versão no .dproj
     ?
     ??? .vscode\                    <-- Pasta de configurações do VS Code (OBRIGATÓRIO)
          ??? tasks.json             <-- Define as tarefas e os menus de escolha

### ?? Documentação dos Arquivos

| Arquivo | Descrição |
| :--- | :--- |
| `build_local.bat` | O coração da pipeline. Recebe os parâmetros do VS Code, limpa arquivos fantasmas do cache, chama o injetor de versão, executa o MSBuild (para garantir a integridade do Manifesto e do Ícone) e, por fim, aciona o compilador ultra-rápido (`dcc64.exe`). Nos modos Debug/Fast, abre o sistema automaticamente. |
| `update_version.ps1` | Script PowerShell invocado pelo `.bat`. Garante a integridade matemática da versão (ex: aniquila zeros à esquerda, forçando `11.2.4.0`) e atualiza as tags visuais do `.dproj` de forma cirúrgica com Regex, preservando a integridade do XML. |
| `tasks.json` | Arquivo residente na `.vscode`. Cria a interface no VS Code para perguntar qual projeto compilar e qual versão injetar. Funciona como a "ponte" entre o Editor e o `.bat`. |
| `keybindings.json` | Configuração local de atalhos do VS Code de cada desenvolvedor. Mapeia as combinações de teclado diretamente para as tarefas do `tasks.json`. |

---

## ?? Instalação e Configuração (Para novos Devs)

Siga os passos abaixo para configurar a sua máquina:

### 1. Clonar/Posicionar os Scripts
Certifique-se de que os arquivos `build_local.bat` e `update_version.ps1` estão localizados na **raiz** do repositório (ex: `C:\git\bimer\`). 

### 2. Configurar as Tarefas (.vscode)
Garanta que a pasta `.vscode` existe na raiz do projeto e que o arquivo `tasks.json` está dentro dela. 

### 3. Configurar os Atalhos (Keybindings)
Os atalhos de teclado são configurações exclusivas da sua instalação do VS Code. Para configurá-los:
1. No VS Code, pressione `Ctrl + Shift + P`.
2. Digite **"Preferences: Open Keyboard Shortcuts (JSON)"** e pressione `Enter`.
3. Adicione o bloco abaixo dentro do array `[ ]` existente:

    ```json
    [
        {
            "key": "ctrl+alt+f",
            "command": "workbench.action.tasks.runTask",
            "args": "Compilar: FAST + Run"
        },
        {
            "key": "ctrl+alt+d",
            "command": "workbench.action.tasks.runTask",
            "args": "Compilar: DEBUG + Run"
        },
        {
            "key": "ctrl+alt+r",
            "command": "workbench.action.tasks.runTask",
            "args": "Compilar: RELEASE"
        }
    ]
    ```

---

## ?? Como Usar no Dia a Dia

**Abandone o mouse.** Para compilar, utilize seus atalhos recém-configurados:

* <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>F</kbd> : **FAST + Run** (Compilação ultra-rápida, ideal para testar código local. Abre o sistema ao terminar).
* <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>D</kbd> : **DEBUG + Run** (Gera informações de debug completas. Abre o sistema ao terminar).
* <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>R</kbd> : **RELEASE** (Compilação final e otimizada. Não executa o sistema no final).

### O Fluxo de Execução:
1. Ao acionar o atalho, o VS Code exibirá um menu dropdown perguntando **qual projeto você deseja compilar** (ex: *Bimer*, *LiberadorEstoque*).
2. Em seguida, ele pedirá a **Versão do EXE**:
   * **Manter a versão atual:** Apenas pressione `Enter` (deixe o campo em branco). O script pulará a injeção e fará o build super rápido.
   * **Injetar nova versão:** Digite a numeração exata (ex: `11.2.4`) e pressione `Enter`.

---

## ? Adicionando Novos Projetos ao Build

Quando a equipe desenvolver um novo módulo, integrador ou job, ele precisa ser mapeado no VS Code editando o arquivo `.vscode/tasks.json`.

Vá até o bloco `"id": "escolhaProjeto"` e adicione o caminho do novo projeto na lista `"options"`.

> ?? **REGRA DE OURO:** O caminho deve seguir **EXATAMENTE** este formato: `caminho\da\pasta\NomeDoArquivoDproj` (Omitindo a extensão `.dproj` e escapando as barras com `\\`).

**Exemplo:**
Se o novo projeto está localizado em `C:\git\bimer\geral\integrador\IntegradorXPTO.dproj`, a adição no JSON ficará assim:

    ```json
    "options": [
        "faturamento\\BimerFaturamento",
        "Bimer",
        "geral\\gerenteeletronico.jobs.liberadorestoque\\LiberadorEstoque",
        "core\\BimerCore",
        "geral\\integrador\\IntegradorXPTO" // <-- Novo projeto adicionado seguindo a regra
    ]
    ```

---

## ? Solução de Problemas (Troubleshooting)

**1. O sistema compilou, mas ao abrir dá "Erro na Configuração Lado a Lado"**
> Isso não deve mais acontecer com a atual arquitetura nativa. Esse erro ocorria devido à codificação inválida (BOM invisível) no arquivo de Manifesto. Nosso script agora delega a construção desse recurso ao `MSBuild` oficial, o que garante 100% de integridade. Se ocorrer, delete o arquivo `.res` do diretório e compile novamente.

**2. O ícone sumiu ou o sistema quebra com `EResNotFound Resource 1`**
> O `MAINICON` (Resource 1) é fundamental. O MSBuild agora garante sua injeção automática. Certifique-se apenas de que o caminho do ícone não esteja quebrado nas opções do projeto (`Project > Options > Application > Icons`) na IDE do Delphi.

**3. Por que a compilação usa o `.res` do `C:\git\bimer` e não da biblioteca (`C:\LibraryDelphiAlexandria...`)?**
> O compilador de linha de comando (`dcc64`) possui o vício de buscar arquivos `.res` obsoletos no cache global de bibliotecas caso não ache um arquivo fresco localmente (causando a temida versão fantasma `11.02.03.00`). O `build_local.bat` foi desenhado para quebrar esse comportamento: ele gera o `.res` na hora e o transporta direto para a raiz do `.dpr`, forçando o compilador a utilizar o recurso injetado, ignorando o cache.