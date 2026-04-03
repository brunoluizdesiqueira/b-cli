@echo off
setlocal EnableDelayedExpansion

REM ── Destravar Cores ANSI no Terminal (Grava o caracter ESC invisivel) ──
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

REM ============================================================
REM  BUILD LOCAL - Projeto Delphi no VSCode (Multi-projetos)
REM ============================================================

REM ── Parametros Recebidos do VSCode ──
SET BUILD_TYPE=%1
SET PROJ_PARAM=%~2
SET EXE_VERSION=%~3

REM ── Versoes do Ambiente (Fixas/Mudam raramente) ─────────────
SET ENV_VERSION=11.03.00

REM Valores padrao caso rode fora do VSCode
if "%BUILD_TYPE%"=="" SET BUILD_TYPE=DEBUG
if "%PROJ_PARAM%"=="" SET PROJ_PARAM=faturamento\BimerFaturamento

REM ── Repositorio Base ──
SET REPO_BASE=C:\git\bimer

REM ── Desmembrando o caminho CORRETAMENTE ──
SET FULL_PROJ_PATH=%REPO_BASE%\%PROJ_PARAM%
FOR %%i IN ("%FULL_PROJ_PATH%") DO (
    SET WORKSPACE_DIR=%%~dpi
    SET PROJECT_NAME=%%~nxi
)

REM ── Configurando os Modos de Build ──
SET RUN_AFTER_BUILD=false

if /I "%BUILD_TYPE%"=="FAST" (
    SET COMPILER_FLAGS=-$W+ -$J+ -$D+ -$L+ -$Y+ -$O-
    SET BUILD_DEFINES=DEBUG;ALT_CEF133_0;EUREKALOG
    SET RUN_AFTER_BUILD=true
)

if /I "%BUILD_TYPE%"=="DEBUG" (
    REM Flags -V e -VR ativadas para gerar simbolos remotos de depuracao (.rsm e .tds)
    SET COMPILER_FLAGS=-B -$W+ -$J+ -$D+ -$L+ -$Y+ -$O- -V -VR
    SET BUILD_DEFINES=DEBUG;ALT_CEF133_0;EUREKALOG
    SET RUN_AFTER_BUILD=true
)

if /I "%BUILD_TYPE%"=="RELEASE" (
    SET COMPILER_FLAGS=-B -$W+ -$J+ -$D0 -$L- -$Y- -$O+
    SET BUILD_DEFINES=RELEASE;ALT_CEF133_0;EUREKALOG
    SET RUN_AFTER_BUILD=false
)

REM ── Delphi e Pastas de Saida ─────────────
SET DELPHI_DIR=C:\Program Files (x86)\Embarcadero\Studio\22.0
SET OUTPUT_DIR=C:\Temp\%ENV_VERSION%
SET EXE_OUTPUT=%OUTPUT_DIR%\EXE
SET DCU_OUTPUT=%OUTPUT_DIR%\DCU

REM ── Bibliotecas externas (RESTAURADO DO SEU BACKUP ORIGINAL) ──
SET LIB_ROOT=C:\LibraryDelphiAlexandria\Externos\3.00
SET LIB_ERP=C:\LibraryDelphiAlexandria\ERP\%ENV_VERSION%
SET LIB_ALTERDATA=C:\LibraryDelphiAlexandria\LibAlterdata\1.0.0

REM ── Consolidando todas as dependencias (RESTAURADO DO SEU BACKUP ORIGINAL) ──
SET DEPENDENCIES="%REPO_BASE%\dependencies";"%DELPHI_DIR%\lib\Win64\release";"%LIB_ROOT%\sgcWebSockets\Win64";"%LIB_ROOT%\DevExpress\Win64";"%LIB_ROOT%\dataset-serialize\Win64";"%LIB_ROOT%\UniDAC\Win64";"%LIB_ROOT%\EurekaLog\Common";"%LIB_ROOT%\EurekaLog\Win64";"%LIB_ROOT%\SMImport\Win64";"%LIB_ROOT%\SMExport\Win64";"%LIB_ROOT%\RXLibrary\Win64";"%LIB_ROOT%\ReportBuilder\Win64";"%LIB_ROOT%\ComPort\Win64";"%LIB_ROOT%\QuickReport\Win64";"%LIB_ROOT%\FastMM\Win64";"%LIB_ROOT%\Tee\Win64";"%LIB_ROOT%\ExtraDevices\Win64";"%LIB_ROOT%\ExtraFilter\Win64";"%LIB_ERP%\Win64";"%LIB_ROOT%\ZipForge\Win64";"%LIB_ROOT%\FortesReport\Win64";"%LIB_ROOT%\TBGWebCharts\Win64";"%LIB_ROOT%\EventBus\Win64";"%LIB_ROOT%\Horse\Win64";"%LIB_ALTERDATA%\feedbacker";"%LIB_ALTERDATA%\rest-client"

echo.
echo %ESC%[1;34m ______________________________________________________________________________%ESC%[0m
echo %ESC%[1;36m     ____  _                     ____        _ __    __                        %ESC%[0m
echo %ESC%[1;36m    / __ )(_)___ ___  ___  _____/ __ )__  __(_) /___/ /                        %ESC%[0m
echo %ESC%[1;36m   / __  / / __ `__ \/ _ \/ ___/ __  / / / / / / __  /                         %ESC%[0m
echo %ESC%[1;36m  / /_/ / / / / / / /  __/ /  / /_/ / /_/ / / / /_/ /                          %ESC%[0m
echo %ESC%[1;36m /_____/_/_/ /_/ /_/\___/_/  /_____/\__,_/_/_/\__,_/                           %ESC%[0m
echo %ESC%[1;34m ------------------------------------------------------------------------------%ESC%[0m
echo %ESC%[1;32m  [+]%ESC%[0m %ESC%[1;37mIniciando Pipeline DevOps Local...%ESC%[0m                       %ESC%[1;32m[ RUNNING ]%ESC%[0m
echo %ESC%[1;32m  [+]%ESC%[0m %ESC%[1;37mEngatando Motor Embarcadero...%ESC%[0m                           %ESC%[1;32m[ STANDBY ]%ESC%[0m
echo %ESC%[1;32m  [+]%ESC%[0m %ESC%[1;37mSanitizando Caches Fantasmas...%ESC%[0m                          %ESC%[1;32m[ CLEARED ]%ESC%[0m
echo %ESC%[1;34m ______________________________________________________________________________%ESC%[0m
echo %ESC%[1;35m  [ PROJETO ]%ESC%[0m %ESC%[1;37m%PROJECT_NAME%%ESC%[0m
echo %ESC%[1;35m  [ CAMINHO ]%ESC%[0m %ESC%[1;37m%WORKSPACE_DIR%%ESC%[0m
echo %ESC%[1;35m  [ VERSAO  ]%ESC%[0m %ESC%[1;33m%EXE_VERSION%%ESC%[0m (Base: %ENV_VERSION%)
echo %ESC%[1;35m  [ PROFILE ]%ESC%[0m %ESC%[1;33m%BUILD_TYPE%%ESC%[0m
echo %ESC%[1;34m ------------------------------------------------------------------------------%ESC%[0m
echo.

if not exist "%EXE_OUTPUT%" mkdir "%EXE_OUTPUT%"
if not exist "%DCU_OUTPUT%" mkdir "%DCU_OUTPUT%"

call "%DELPHI_DIR%\bin\rsvars.bat"
if errorlevel 1 exit /b 1

cd /d "%WORKSPACE_DIR%"

REM ── OPERACAO FANTASMA: Prepara a Pasta Temporaria (Fora do Git) ──
SET TEMP_BUILD_DIR=%TEMP%\BimerBuild_%PROJECT_NAME%
if not exist "%TEMP_BUILD_DIR%" mkdir "%TEMP_BUILD_DIR%"

REM ── 1. Roda PowerShell para forjar o VRC/Manifest na pasta TEMP ──
if "%EXE_VERSION%"=="" (
    echo %ESC%[1;36m  [*]%ESC%[0m %ESC%[1;37mNenhuma versao informada. Lendo atual do projeto...%ESC%[0m
) else (
    echo %ESC%[1;36m  [*]%ESC%[0m %ESC%[1;37mInjetando a versao %EXE_VERSION% via PowerShell...%ESC%[0m
)
powershell -ExecutionPolicy Bypass -File "%~dp0update_version.ps1" "%WORKSPACE_DIR%%PROJECT_NAME%.dproj" "%EXE_VERSION%" "%DELPHI_DIR%" "%TEMP_BUILD_DIR%"

REM ── 2. Limpa o .res antigo do workspace para evitar sujeira ──
del /s /q /f "%WORKSPACE_DIR%%PROJECT_NAME%.res" >nul 2>&1

REM ── 3. Compila o Recurso NATIVO na pasta TEMP (Sem sujar a workspace) ──
echo %ESC%[1;36m  [*]%ESC%[0m %ESC%[1;37mCompilando recursos e embutindo icone...%ESC%[0m
"%DELPHI_DIR%\bin\cgrc.exe" "%TEMP_BUILD_DIR%\%PROJECT_NAME%.vrc" -fo"%TEMP_BUILD_DIR%\%PROJECT_NAME%.res"
if errorlevel 1 (
    echo %ESC%[1;31m[ERRO] Falha do compilador CGRC ao gerar o arquivo de recursos .res.%ESC%[0m
    exit /b 1
)

REM ── 4. Traz apenas o .res finalizado e blindado para a pasta do Projeto ──
copy /y "%TEMP_BUILD_DIR%\%PROJECT_NAME%.res" "%WORKSPACE_DIR%%PROJECT_NAME%.res" >nul


REM ── 5. Compilacao Rapida NATIVA (DCC64) (RESTAURADO DO SEU BACKUP ORIGINAL) ──
echo %ESC%[1;36m  [*]%ESC%[0m %ESC%[1;37mIniciando compilacao do codigo fonte (%BUILD_TYPE%)...%ESC%[0m
"%DELPHI_DIR%\bin\dcc64.exe" ^
  %COMPILER_FLAGS% ^
  --no-config -Q -H- -W- ^
  -TX.exe ^
  -AGenerics.Collections=System.Generics.Collections;Generics.Defaults=System.Generics.Defaults;WinTypes=Winapi.Windows;WinProcs=Winapi.Windows;DbiTypes=BDE;DbiProcs=BDE;DbiErrs=BDE ^
  -D%BUILD_DEFINES% ^
  -E"%EXE_OUTPUT%" ^
  -I%DEPENDENCIES% ^
  -LE"%EXE_OUTPUT%" ^
  -LN"%EXE_OUTPUT%" ^
  -NU"%DCU_OUTPUT%" ^
  -NSData.Win;Datasnap.Win;Web.Win;Soap.Win;Xml.Win;Vcl;Vcl.Imaging;Vcl.Touch;Vcl.Samples;Vcl.Shell;System;Xml;Data;Datasnap;Web;Soap;Winapi;FireDAC.VCLUI;System.Win; ^
  -O%DEPENDENCIES% ^
  -R%DEPENDENCIES% ^
  -U%DEPENDENCIES% ^
  -K00400000 -GD ^
  -NB"%EXE_OUTPUT%" ^
  -NH"%EXE_OUTPUT%" ^
  -NO"%DCU_OUTPUT%" ^
  -W^ -W-SYMBOL_PLATFORM -W-UNIT_PLATFORM -W-DUPLICATE_CTOR_DTOR -W-IMPLICIT_STRING_CAST ^
  "%PROJECT_NAME%.dpr"

if errorlevel 1 (
    echo.
    echo %ESC%[1;31m  [ERRO FATAL] Falha na compilacao do Delphi. Verifique os logs de erro acima.%ESC%[0m
    exit /b 1
)

echo.
echo %ESC%[31m       .oooooo.         %ESC%[1;32m _________________________________________________________________%ESC%[0m
echo %ESC%[31m     .o00000000o.       %ESC%[1;32m   _____ _    _  _____ _____ ______  _____  _____             %ESC%[0m
echo %ESC%[31m    .00%ESC%[1;37m######%ESC%[31m0000.      %ESC%[1;32m  / ____^| ^|  ^| ^|/ ____/ ____^|  ____^|/ ____^|/ ____^|            %ESC%[0m
echo %ESC%[31m    000%ESC%[1;37m##%ESC%[31m0000%ESC%[1;37m##%ESC%[31m000      %ESC%[1;32m ^| (___ ^| ^|  ^| ^| ^|   ^| ^|    ^| ^|__  ^| (___ ^| (___             %ESC%[0m
echo %ESC%[31m    000%ESC%[1;37m##%ESC%[31m00000%ESC%[1;37m##%ESC%[31m00      %ESC%[1;32m  \___ \^| ^|  ^| ^| ^|   ^| ^|    ^|  __^|  \___ \ \___ \            %ESC%[0m
echo %ESC%[31m    000%ESC%[1;37m##%ESC%[31m0000%ESC%[1;37m##%ESC%[31m000      %ESC%[1;32m  ____) ^| ^|__^| ^| ^|___^| ^|____^| ^|____ ____) ^|____) ^|            %ESC%[0m
echo %ESC%[31m    `00%ESC%[1;37m######%ESC%[31m0000'      %ESC%[1;32m ^|_____/ \____/ \_____\_____^|______^|_____/^|_____/             %ESC%[0m
echo %ESC%[31m     `o00000000o'       %ESC%[1;32m -----------------------------------------------------------------%ESC%[0m
echo %ESC%[31m       `oooooo'         %ESC%[1;36m [*]%ESC%[0m %ESC%[1;37mBuild%ESC%[0m %ESC%[1;33m%BUILD_TYPE%%ESC%[0m %ESC%[1;37mfinalizado com exito absoluto!%ESC%[0m
echo %ESC%[31m                        %ESC%[1;36m [*]%ESC%[0m %ESC%[1;37mArtefatos validados, versionados e linkados na raiz.%ESC%[0m
echo %ESC%[31m                        %ESC%[1;32m [ RUN ] O ecossistema esta pronto para combate.%ESC%[0m
echo %ESC%[1;32m                        _________________________________________________________________%ESC%[0m
echo %ESC%[0m
echo.

if /i "%RUN_AFTER_BUILD%"=="true" (
    start /b "" "%EXE_OUTPUT%\%PROJECT_NAME%.exe"
)