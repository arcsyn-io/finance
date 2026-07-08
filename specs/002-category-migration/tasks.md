# Tasks: Categorias

**Input**: `specs/002-category-migration/spec.md`, `specs/002-category-migration/plan.md`

## Phase 1: Tests First

- [X] T001 Criar testes de categoria cobrindo create, update, activate/deactivate, listagem e erros.
- [X] T002 Rodar `pnpm test` e confirmar Red.

## Phase 2: Domain and Application

- [X] T003 Criar dominio `Category`, `CategoryType` e erros de categoria.
- [X] T004 Criar commands, schemas e mappers de categoria.
- [X] T005 Implementar use cases de list/create/update/activate/deactivate.
- [X] T006 Implementar `CategoryService` como facade com Unit of Work.

## Phase 3: Persistence and Actions

- [X] T007 Implementar `CategoryRepository` com Drizzle e `ApplicationContext`.
- [X] T008 Implementar Server Actions de categoria.

## Phase 4: UI

- [X] T009 Criar pagina `/categories` com listagem agrupada, formulario de criacao, edicao inline e botoes de ativar/desativar.
- [X] T010 Adicionar link para categorias no dashboard privado.

## Phase 5: Validation and PR

- [X] T011 Rodar `pnpm test`.
- [X] T012 Rodar `pnpm typecheck`.
- [X] T013 Rodar `pnpm lint`.
- [X] T014 Commitar, fazer push e abrir PR.
