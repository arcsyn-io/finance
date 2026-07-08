# Implementation Plan: Categorias

**Branch**: `codex/category-migration` | **Date**: 2026-07-08 | **Spec**: `specs/002-category-migration/spec.md`

## Summary

Migrar o modulo de categorias do `old/` para Next.js com camadas separadas: dominio, commands, schemas, mappers, service facade, use cases, repository Drizzle, Server Actions e pagina privada `/categories`.

## Technical Context

**Language/Version**: TypeScript 5.7  
**Primary Dependencies**: Next.js 15, React 19, Drizzle ORM, Supabase, Zod  
**Storage**: Supabase/Postgres, tabela `public.categories` existente  
**Testing**: Node.js test runner com fakes de repository/use case  
**Target Platform**: Next.js App Router  
**Project Type**: Web full-stack  
**Constraints**: `old/` e fonte da regra de negocio; services recebem `ApplicationContext` + command; transacao via Unit of Work  
**Scope**: CRUD funcional de categorias

## Constitution Check

- Spec antes da implementacao: PASS
- TDD Red -> Green -> Refactor: PASS
- Separacao forte de responsabilidades: PASS
- `old/` usado apenas como fonte de regra de negocio: PASS
- Valores monetarios nao afetados: PASS

## Project Structure

```text
src/
|-- app/(private)/categories/
|   `-- page.tsx
|-- domain/category/
|   |-- category.ts
|   `-- category-errors.ts
|-- server/
|   |-- actions/category-actions.ts
|   |-- commands/category-commands.ts
|   |-- mappers/category-mapper.ts
|   |-- repositories/category-repository.ts
|   |-- schemas/category-schema.ts
|   |-- services/category-service.ts
|   `-- usecases/category/
|       |-- activate-category.usecase.ts
|       |-- create-category.usecase.ts
|       |-- deactivate-category.usecase.ts
|       |-- list-categories.usecase.ts
|       `-- update-category.usecase.ts
`-- test/
    `-- category-service.test.ts
```

## Design Notes

- A pagina chama service para leitura com `ApplicationContext` de usuario.
- Server Actions montam `ApplicationContext`, validam FormData com Zod, mapeiam para command e chamam service.
- Service abre Unit of Work nas escritas e delega regra para use cases.
- Use cases validam e normalizam nome, validam tipo, verificam duplicidade e chamam repository.
- Repository filtra sempre por `userId = context.requireUserPrincipal().id`.

## Validation

1. Escrever testes de regra antes da implementacao.
2. Confirmar Red.
3. Implementar dominio/use cases/service/repository/actions/page.
4. Rodar `pnpm test`, `pnpm typecheck`, `pnpm lint`.
5. Abrir PR.
