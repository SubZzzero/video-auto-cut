# Project Context

## Goal
Build a stable local-only video processing web app with FastAPI + React.

## Execution Rules
- Follow `plan.md` step order.
- Work backend first, then UI.
- Ask the user before running any install command.
- Do not run manual runtime verification unless the user explicitly requests it.
- Keep UI components small and focused.
- Put editable values into dedicated constants/config files.
- Add a short useful comment above every function.
- Keep project text and code in English.

## Architecture
- `app/`: reusable video processing logic.
- `api/`: FastAPI entrypoints and job orchestration.
- `ui/`: React + Vite frontend.
- `tests/`: backend tests.
- `scripts/`: local project automation.

## API Flow
UI uploads a file and settings -> API creates a job -> background processing runs through `app/video` -> UI polls job status -> processed files are served from `/outputs`.

## Current Delivery Target
Implement the full scope through step 12 of `plan.md`, including batch queue, polling progress, lint config, tests, README, and one-command local start.
