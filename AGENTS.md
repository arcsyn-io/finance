# Finance Agents Guide

Este projeto usa Next.js. A implementacao antiga em Java/Spring Boot foi movida para `old/` e esta descontinuada.

Antes de alterar o projeto, leia:

- `agent_docs/architecture.md`
- `agent_docs/conventions.md`
- `agent_docs/contribution.md`
- `agent_docs/workflow.md`

## Regras Essenciais

- Escreva e responda em portugues.
- Nao use `old/` como referencia de arquitetura tecnica.
- Preserve separacao forte entre UI, actions/controllers, services, repositories, DTOs, schemas, mappers e dominio.
- Nao misture DTO, estrutura de dados, service, controller, repository e componente no mesmo arquivo.
- Services sao facades/orquestradores e devem receber `ApplicationContext` e command especifico.
- Use Unit of Work para transacoes; `TransactionContext` deve trafegar dentro do `ApplicationContext`.
- Use GitHub Spec Kit para criar ou atualizar specs antes de implementar mudancas de comportamento.
- Siga TDD com Red -> Green -> Refactor sempre que aplicavel.
- Valores monetarios devem ser tratados como inteiros em centavos.
- As tres dimensoes do dominio financeiro nao devem ser misturadas: fluxo de caixa operacional, liquidez real e patrimonio liquido.

## Stack Atual

- Next.js
- React
- TypeScript
- Supabase/Postgres
- Drizzle
- Zod
- pnpm

## Comandos

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```
