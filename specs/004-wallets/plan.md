# Implementation Plan: Carteiras

**Branch**: `master` | **Date**: 2026-07-09 | **Spec**: `specs/004-wallets/spec.md`

## Summary

Implementar a feature de carteiras na stack atual Next.js/TypeScript, usando `old/` apenas para recuperar regras de negocio e `finance-prototipo.zip` como referencia visual.

## Technical Context

**Language/Version**: TypeScript 5.7  
**Primary Dependencies**: Next.js 15, React 19, Supabase, Zod  
**Testing**: Node.js test runner  
**Target Platform**: Next.js App Router  
**Project Type**: Web full-stack  
**Constraints**: Sem Server Actions na UI, APIs JSON entre front e back, dinheiro em centavos

## Project Structure

```text
src/
|-- app/
|   |-- (private)/wallets/page.tsx
|   `-- api/wallets/
|-- domain/wallet/
|-- modules/wallets/components/
|-- server/
|   |-- controllers/wallet-controller.ts
|   |-- commands/wallet-commands.ts
|   |-- mappers/wallet-mapper.ts
|   |-- repositories/wallet-repository.ts
|   |-- schemas/wallet-schema.ts
|   |-- services/wallet-service.ts
|   `-- usecases/wallet/
`-- test/
    |-- wallet-controller.test.ts
    `-- wallet-service.test.ts
```

## Validation

1. Criar testes de controller e service.
2. Implementar dominio e camada backend.
3. Implementar Route Handlers JSON.
4. Implementar pagina e componente client de carteiras.
5. Adicionar migration idempotente para tabela `wallets`.
6. Rodar `pnpm test`, `pnpm typecheck` e `pnpm lint`.
