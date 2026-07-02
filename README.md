# Controle de Toners — Calpar

App desktop **100% local** (Tauri 2) para monitorar toners de impressoras. Sem servidor, sem API, sem internet. Dados ficam no PC.

## Stack

- **Desktop:** Tauri 2 (Rust)
- **UI:** Next.js (static export) + React + **MUI**
- **Dados:** `localStorage` (JSON) no próprio app

## Regras de negócio

- Status **verde** quando quantidade ≥ 3, **vermelho** quando < 3
- Impressoras do **mesmo modelo** somam quantidade (agrupamento)
- Vermelho → botão **Gerar e-mail de SC** abre o cliente de e-mail padrão (`mailto:`) já preenchido com o código do toner para `lucas.dobis@calpar.com.br`
- Import/Export de backup em `.json`
- Tema claro/escuro (Configurações)

## Pré-requisitos

- Node.js 20+
- Rust (rustup)

## Desenvolvimento

```powershell
cd frontend
npm install
npm run tauri:dev
```

## Gerar .exe instalável

```powershell
cd frontend
npm run tauri:build
```

Instalador em `frontend/src-tauri/target/release/bundle/`.

## Estrutura

```
frontend/
  src/
    app/            layout + página (MUI)
    components/     Dashboard, PrinterDialog
    lib/            storage (localStorage), types, mailto
    theme/          ThemeRegistry (MUI claro/escuro)
  src-tauri/        Tauri 2 (Rust) — só janela, sem backend
```

## Observação

O e-mail usa `mailto:` (abre Outlook/cliente padrão) porque o app é local e não usa servidor SMTP. É só clicar em enviar.

A pasta `backend/` (FastAPI/Python) ficou **obsoleta** nesta versão local e pode ser removida.
