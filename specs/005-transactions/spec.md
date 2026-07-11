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

## Extension 2026-07-10 - Vinculo de transferencia pela listagem

### User Story 3 - Vincular transferencias pela listagem (Priority: P1)

Como usuario autenticado, quero acionar o icone de transferencia em uma transacao nao vinculada, para transformar dois lancamentos existentes ou uma nova contraparte em uma transferencia interna sem classifica-la como consumo ou renda.

**Independent Test**: A tela `/transactions` abre uma modal pelo icone de transferencia e envia JSON para vincular a transacao atual a uma transacao existente ou criar um novo lancamento oposto vinculado.

**Acceptance Scenarios**:

1. **Given** uma transacao nao excluida, sem `transferId`, **When** abro a modal de transferencia, **Then** posso escolher entre "Vincular transacao existente" e "Criar novo registro".
2. **Given** duas transacoes existentes nao excluidas, sem transferencia, de carteiras diferentes, direcoes opostas e mesmo valor, **When** vinculo pela modal, **Then** o backend cria um registro em `transfers`, atualiza ambas com o mesmo `transferId` e marca `economicEvent=TRANSFER`.
3. **Given** uma transacao existente nao excluida e sem transferencia, **When** crio novo registro pela modal, **Then** o novo lancamento herda valor e data da origem, usa carteira diferente, categoria de direcao oposta, e ambos ficam vinculados ao mesmo `transferId`.
4. **Given** uma transacao ja vinculada, excluida ou uma contraparte invalida, **When** tento vincular, **Then** recebo erro de negocio em portugues e nenhum vinculo parcial e mantido.
5. **Given** uma transacao ja vinculada a transferencia, **When** aciono o icone de transferencia, **Then** vejo uma modal para desvincular a transferencia.
6. **Given** confirmo o desvinculo, **When** a operacao conclui, **Then** os lancamentos vinculados permanecem cadastrados, ficam sem `transferId`, e o registro de `transfers` e removido.

### Additional Requirements

- **FR-013**: A listagem de transacoes MUST exibir o icone de transferencia como acao para transacoes nao excluidas e sem `transferId`.
- **FR-014**: A acao de transferencia MUST abrir uma modal com os modos "vincular transacao existente" e "criar novo registro".
- **FR-015**: O backend MUST expor mutacao JSON para vincular transferencia a partir de uma transacao de origem.
- **FR-016**: Vinculo com transacao existente MUST exigir origem e destino sem `transferId`, nao excluidos, de carteiras diferentes, direcoes opostas e mesmo valor.
- **FR-017**: Criacao de novo registro vinculado MUST herdar `amountCents` e `occurredOn` da origem, exigir carteira diferente e categoria de tipo oposto a direcao da origem.
- **FR-018**: Ao vincular transferencia, os lancamentos envolvidos MUST receber `economicEvent=TRANSFER`.
- **FR-019**: A transferencia criada MUST registrar carteira/categoria de saida e carteira/categoria de entrada conforme a direcao `OUT`/`IN`.
- **FR-020**: O icone de transferencia em transacao ja vinculada MUST abrir modal de desvinculo.
- **FR-021**: O backend MUST expor mutacao JSON para desvincular transferencia a partir de uma transacao vinculada.
- **FR-022**: Desvincular transferencia MUST manter os lancamentos e remover o registro de transferencia.

### Additional Business Rules

- Transferencia interna nao representa consumo nem renda operacional; ela apenas move liquidez entre carteiras.
- Toda transferencia vinculada pela listagem deve possuir exatamente dois lancamentos: um `OUT` e um `IN`, ambos com mesmo valor e mesmo `transferId`.
- O lancamento `OUT` determina `fromWalletId`/`fromCategoryId`; o lancamento `IN` determina `toWalletId`/`toCategoryId`.
- Para vincular dois lancamentos existentes, a data da transferencia deve ser a mais recente entre as duas transacoes.
- Ao desvincular uma transferencia, os fatos financeiros devem continuar existindo como lancamentos independentes.
