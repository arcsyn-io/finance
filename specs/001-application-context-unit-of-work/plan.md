# Implementation Plan: Application Context e Unit of Work

**Branch**: `001-application-context-unit-of-work` | **Date**: 2026-07-08 | **Spec**: `specs/001-application-context-unit-of-work/spec.md`

## Summary

Implementar a infraestrutura base de aplicacao para `ApplicationContext`, `TransactionContext`, Unit of Work com Drizzle e helper de repository para resolver o client correto. A mudanca e fundacional e nao altera rotas, UI ou banco.

## Technical Context

**Language/Version**: TypeScript 5.7  
**Primary Dependencies**: Next.js 15, React 19, Drizzle ORM, postgres-js, Supabase  
**Storage**: Supabase/Postgres via Drizzle  
**Testing**: Node.js test runner para testes unitarios pequenos compilados por TypeScript  
**Target Platform**: Next.js server runtime  
**Project Type**: Web full-stack  
**Performance Goals**: Sem overhead significativo fora de transacoes  
**Constraints**: Services recebem apenas `ApplicationContext` e command; transacao trafega no contexto  
**Scale/Scope**: Infraestrutura compartilhada para futuras features financeiras

## Constitution Check

- Separacao forte de responsabilidades: PASS
- TDD Red -> Green -> Refactor: PASS
- Spec antes da implementacao: PASS
- `old/` descontinuado: PASS
- Valores monetarios nao afetados: PASS

## Project Structure

### Documentation

```text
specs/001-application-context-unit-of-work/
|-- spec.md
|-- plan.md
`-- tasks.md
```

### Source Code

```text
src/
|-- server/
|   |-- context/
|   |   `-- application-context.ts
|   |-- unit-of-work/
|   |   |-- unit-of-work.ts
|   |   `-- drizzle-unit-of-work.ts
|   `-- repositories/
|       `-- database-client.ts
`-- test/
    |-- application-context.test.ts
    `-- unit-of-work.test.ts
```

## Design Notes

`ApplicationContext` sera uma classe imutavel por convencao: metodos de derivacao retornam novo contexto. Isso evita mutacao acidental do contexto original quando uma transacao e aberta.

`TransactionContext` armazenara o client transacional. Repositories nao recebem `tx` separado; eles resolvem o client pelo contexto.

`DrizzleUnitOfWork` recebera o client Drizzle no construtor, com default para `db`, facilitando testes com fake.

## Validation

- Criar testes antes da implementacao.
- Rodar `pnpm test` para confirmar Red.
- Implementar arquivos de contexto e Unit of Work.
- Rodar `pnpm test`, `pnpm typecheck` e `pnpm lint`.
