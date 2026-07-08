# Feature Specification: Application Context e Unit of Work

**Feature Branch**: `001-application-context-unit-of-work`  
**Created**: 2026-07-08  
**Status**: Draft  
**Input**: "Implementar ApplicationContext, TransactionContext e Unit of Work para services, use cases e repositories na stack Next.js/Drizzle."

## User Scenarios & Testing

### User Story 1 - Contexto de aplicacao consistente (Priority: P1)

Como desenvolvedor da aplicacao, quero representar a identidade da operacao em um `ApplicationContext`, para que controllers, services, use cases e repositories compartilhem principal, data e metadados sem parametros soltos.

**Why this priority**: Sem contexto padronizado, cada camada tende a passar usuario, sistema, data e correlacao de formas diferentes.

**Independent Test**: Criar contexto de usuario e de sistema, exigir usuario quando necessario e verificar que contexto derivado preserva principal, `correlationId` e `now`.

**Acceptance Scenarios**:

1. **Given** um principal de usuario, **When** o contexto e criado, **Then** `requireUserPrincipal()` retorna o principal.
2. **Given** um principal de sistema, **When** `requireUserPrincipal()` e chamado, **Then** um erro de autenticacao e lancado.
3. **Given** um contexto com `correlationId` e `now`, **When** uma transacao e anexada, **Then** o novo contexto preserva os metadados.

---

### User Story 2 - Transacoes propagadas via contexto (Priority: P1)

Como desenvolvedor de services, quero abrir transacoes por Unit of Work e passar um contexto transacional para use cases e repositories, para garantir consistencia sem adicionar um terceiro parametro de transacao.

**Why this priority**: Operacoes financeiras precisam de consistencia entre validacoes, escritas, outbox e efeitos internos.

**Independent Test**: Executar `UnitOfWork.execute(context, work)` com um client fake e verificar que o callback recebe um contexto diferente contendo `TransactionContext`.

**Acceptance Scenarios**:

1. **Given** um contexto sem transacao, **When** o Unit of Work executa uma operacao, **Then** o callback recebe `context.transaction`.
2. **Given** uma operacao que retorna valor, **When** a transacao conclui com sucesso, **Then** o resultado do callback e retornado.
3. **Given** uma operacao que falha, **When** o callback lanca erro, **Then** o erro e propagado.

---

### User Story 3 - Repositories usam o client correto (Priority: P2)

Como desenvolvedor de repositories, quero resolver o client de banco a partir do `ApplicationContext`, para que queries usem a transacao quando ela existir e o client padrao quando nao existir.

**Why this priority**: A escolha do client precisa ser uniforme e invisivel para services/use cases.

**Independent Test**: Usar um contexto com e sem transacao e verificar que o resolver retorna o client esperado.

**Acceptance Scenarios**:

1. **Given** contexto sem transacao, **When** o repository resolve o database, **Then** o client padrao e usado.
2. **Given** contexto com transacao, **When** o repository resolve o database, **Then** o client transacional e usado.

## Requirements

### Functional Requirements

- **FR-001**: O sistema MUST fornecer `ApplicationContext` com `principal`, `transaction`, `correlationId` e `now`.
- **FR-002**: O sistema MUST suportar principal do tipo `user` e `system`.
- **FR-003**: O sistema MUST fornecer factory para contexto de usuario e sistema.
- **FR-004**: O sistema MUST fornecer metodo para exigir principal de usuario e falhar quando o principal for `system`.
- **FR-005**: O sistema MUST fornecer `TransactionContext` contendo o client transacional de banco.
- **FR-006**: O sistema MUST fornecer `withTransaction` para derivar contexto transacional sem alterar o contexto original.
- **FR-007**: O sistema MUST fornecer contrato `UnitOfWork.execute(context, work)`.
- **FR-008**: O sistema MUST fornecer implementacao Drizzle/Postgres do Unit of Work usando `db.transaction`.
- **FR-009**: O sistema MUST fornecer helper para repositories resolverem o client de banco a partir do `ApplicationContext`.
- **FR-010**: A transacao MUST trafegar dentro do `ApplicationContext`, nunca como terceiro parametro de service.

### Key Entities

- **ApplicationContext**: Identidade e metadados de uma operacao de aplicacao.
- **ApplicationPrincipal**: Autor da operacao, podendo ser `user` ou `system`.
- **TransactionContext**: Wrapper do client transacional criado pelo Unit of Work.
- **UnitOfWork**: Contrato que controla abertura de transacao e propagacao do contexto transacional.

## Success Criteria

- **SC-001**: Typecheck passa sem relaxar `strict`.
- **SC-002**: Testes unitarios de contexto e Unit of Work passam.
- **SC-003**: Services futuros conseguem usar assinatura `(context, command)` sem parametro de transacao.
- **SC-004**: Repositories futuros conseguem usar `resolveDatabaseClient(context)` para operar dentro ou fora de transacao.
