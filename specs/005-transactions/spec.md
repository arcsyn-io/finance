# Feature Specification: Transacoes

**Feature Branch**: `master`  
**Created**: 2026-07-10  
**Input**: "Leia o arquivo finance-protipo.zip e implemente a tela de transacao... utilize old como base de regra de negocio e prototipo para tela. Todo comunicacao de front para back deve ser em json."

## User Stories

### User Story 1 - Registrar lancamentos manualmente (Priority: P1)

Como usuario autenticado, quero listar, criar e corrigir transacoes financeiras em uma tela dedicada, para manter os fatos financeiros do periodo atualizados.

**Independent Test**: A tela `/transactions` carrega lancamentos, carteiras e categorias do usuario e todas as mutacoes usam APIs JSON.

**Acceptance Scenarios**:

1. **Given** carteiras e categorias ativas, **When** crio uma transacao com data, carteira, categoria, natureza, evento opcional, valor em reais e descricao, **Then** o backend persiste `amountCents` como inteiro positivo.
2. **Given** uma categoria de receita, **When** crio ou atualizo uma transacao, **Then** a direcao persistida e `IN`.
3. **Given** uma categoria de despesa, **When** crio ou atualizo uma transacao, **Then** a direcao persistida e `OUT`.
4. **Given** uma carteira inativa, **When** tento usa-la em uma transacao, **Then** recebo erro de negocio em portugues.
5. **Given** uma transacao existente, **When** excluo pela tela, **Then** ela recebe soft delete e nao e removida fisicamente.

### User Story 2 - Filtrar e revisar transacoes (Priority: P1)

Como usuario autenticado, quero filtrar transacoes por periodo, carteira, categoria, natureza, evento e excluidas, para revisar movimentacoes sem misturar dimensoes financeiras.

**Independent Test**: `GET /api/entries` aceita filtros em query string e retorna JSON com lancamentos e totais do periodo.

**Acceptance Scenarios**:

1. **Given** transacoes no mes atual, **When** abro a tela, **Then** vejo contagem, receitas, despesas e liquido do periodo.
2. **Given** filtros aplicados, **When** a tela consulta a API, **Then** apenas lancamentos compatíveis sao retornados.
3. **Given** `includeDeleted=false`, **When** listo transacoes, **Then** lancamentos excluidos ficam ocultos.

## Requirements

- **FR-001**: O projeto MUST ter uma pagina privada `/transactions`.
- **FR-002**: A navegacao principal MUST apontar "Transacoes" para `/transactions`.
- **FR-003**: Mutacoes MUST usar Route Handlers JSON em `src/app/api/entries/**/route.ts`.
- **FR-004**: O frontend MUST enviar e receber JSON, sem Server Actions para mutacoes.
- **FR-005**: `amountCents` MUST ser inteiro positivo no backend; sinal visual e derivado de `direction`.
- **FR-006**: `direction` MUST ser inferida pela categoria: `INCOME -> IN`, `EXPENSE -> OUT`.
- **FR-007**: Transacoes MUST exigir carteira existente e ativa.
- **FR-008**: Transacoes MUST exigir categoria existente.
- **FR-009**: Transacoes MUST exigir natureza `OPERATIONAL` ou `PATRIMONIAL`.
- **FR-010**: Exclusao MUST ser soft delete via `deletedAt`.
- **FR-011**: Restauracao de transacao excluida MUST ser permitida por JSON.
- **FR-012**: Evento economico pode vir no JSON; se ausente, o backend MUST inferir valor conservador a partir de carteira, natureza, direcao e transferencia.

## Business Rules

- Lancamentos sao fatos financeiros; visoes como fluxo de caixa, liquidez e patrimonio filtram os fatos posteriormente.
- Fluxo de caixa operacional, liquidez real e patrimonio liquido nao devem ser misturados na modelagem da tela.
- Valor monetario trafega e persiste como centavos inteiros.
- Edição de lancamento existe apenas como correcao explicita do fato.
- Categoria define direcao economica do lancamento; usuario nao edita `direction` diretamente.

## Success Criteria

- **SC-001**: Testes de controller e service de transacoes passam em `pnpm test`.
- **SC-002**: `pnpm lint` passa.
- **SC-003**: `pnpm typecheck` passa.
- **SC-004**: A UI de transacoes nao importa Server Actions.
- **SC-005**: Todas as chamadas da UI para backend usam `fetch` com JSON.
