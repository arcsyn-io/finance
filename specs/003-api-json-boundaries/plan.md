# Implementation Plan: Bordas HTTP JSON

**Branch**: `codex/api-json-boundaries` | **Date**: 2026-07-08 | **Spec**: `specs/003-api-json-boundaries/spec.md`

## Summary

Substituir Server Actions por APIs JSON para categorias, login e MFA. A camada de dominio de categorias permanece em services/use cases/repositories; a borda HTTP passa por controllers e Route Handlers.

## Technical Context

**Language/Version**: TypeScript 5.7  
**Primary Dependencies**: Next.js 15, React 19, Supabase, Zod  
**Testing**: Node.js test runner para controllers e services  
**Target Platform**: Next.js App Router  
**Project Type**: Web full-stack  
**Constraints**: Sem uso tecnico de `old/`; services recebem `ApplicationContext` + command; UI envia JSON

## Project Structure

```text
src/
|-- app/api/
|   |-- auth/
|   |-- categories/
|   `-- mfa/
|-- auth/
|   |-- login-form.tsx
|   `-- mfa-form.tsx
|-- modules/categories/components/
|   `-- CategoryForms.tsx
|-- server/controllers/
|   `-- category-controller.ts
`-- test/
    `-- category-controller.test.ts
```

## Validation

1. Atualizar spec.
2. Criar teste de controller de categoria primeiro.
3. Implementar controller e Route Handlers.
4. Migrar UI para componentes client que usam `fetch` JSON.
5. Rodar `pnpm test`, `pnpm typecheck` e `pnpm lint`.
