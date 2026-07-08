# Tasks: Application Context e Unit of Work

**Input**: `specs/001-application-context-unit-of-work/spec.md`, `specs/001-application-context-unit-of-work/plan.md`

## Phase 1: Setup

- [X] T001 Adicionar script `test` no `package.json` usando TypeScript build temporario e Node test runner.
- [X] T002 Criar estrutura `src/server/context`, `src/server/unit-of-work`, `src/server/repositories` e `src/test` quando necessario.

## Phase 2: Tests First

- [X] T003 [P] Criar teste de `ApplicationContext` em `src/test/application-context.test.ts`.
- [X] T004 [P] Criar teste de `UnitOfWork` e resolver de database em `src/test/unit-of-work.test.ts`.
- [X] T005 Rodar `pnpm test` e confirmar Red.

## Phase 3: Implementation

- [X] T006 Implementar `ApplicationContext`, `ApplicationPrincipal`, `PrincipalType` e `TransactionContext`.
- [X] T007 Implementar contrato `UnitOfWork`.
- [X] T008 Implementar `DrizzleUnitOfWork` com `db.transaction`.
- [X] T009 Implementar `resolveDatabaseClient(context)` para repositories.

## Phase 4: Validation

- [X] T010 Rodar `pnpm test` e confirmar Green.
- [X] T011 Rodar `pnpm typecheck`.
- [X] T012 Rodar `pnpm lint`.

## Phase 5: Finalization

- [X] T013 Revisar diff e garantir que `old/` nao foi alterado.
- [X] T014 Commitar e fazer push para `origin/master`.
