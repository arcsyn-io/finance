# Feature Specification: Carteiras

**Feature Branch**: `master`  
**Created**: 2026-07-09  
**Status**: Draft  
**Input**: "implemente a tela de carteiras... backend rotas em json... gere migrations"

## User Scenarios & Testing

### User Story 1 - Gerenciar carteiras via tela dedicada (Priority: P1)

Como usuario autenticado, quero listar, filtrar, criar, editar, ativar e inativar carteiras, para controlar onde dinheiro, investimentos e bens estao alocados.

**Independent Test**: A tela `/wallets` carrega carteiras do usuario e todas as mutacoes usam APIs JSON.

**Acceptance Scenarios**:

1. **Given** carteiras cadastradas, **When** acesso `/wallets`, **Then** vejo nome, tipo, saldo inicial e status.
2. **Given** filtros por nome, tipo ou status, **When** altero os filtros na tela, **Then** a lista exibe apenas carteiras correspondentes.
3. **Given** dados validos, **When** crio uma carteira, **Then** a carteira aparece na lista sem recarregar a pagina.
4. **Given** uma carteira existente, **When** edito nome, tipo ou status, **Then** a tela reflete os dados salvos pela API.
5. **Given** uma carteira ativa, **When** inativo a carteira, **Then** ela fica indisponivel para novos lancamentos e permanece no historico.

### User Story 2 - Mutacoes de carteira via JSON (Priority: P1)

Como frontend, quero enviar e receber JSON para todas as operacoes de carteira, para manter a fronteira entre back e front consistente com o restante do sistema.

**Independent Test**: Controller de carteira valida requests, chama service com `ApplicationContext` e retorna status/body previsiveis.

**Acceptance Scenarios**:

1. **Given** nome e tipo validos, **When** envio `POST /api/wallets`, **Then** recebo `201` com a carteira criada.
2. **Given** dados invalidos, **When** envio JSON para mutacao, **Then** recebo `400` com erro em portugues.
3. **Given** carteira inexistente, **When** atualizo ou altero status, **Then** recebo `404`.

## Requirements

### Functional Requirements

- **FR-001**: O projeto MUST ter uma pagina privada `/wallets`.
- **FR-002**: A pagina MUST se basear no prototipo `finance-prototipo.zip`: lista compacta, busca por nome, filtro por tipo, filtro por status, edicao inline e botao de adicionar.
- **FR-003**: Mutacoes MUST usar Route Handlers JSON em `src/app/api/wallets/**/route.ts`.
- **FR-004**: Controllers MUST validar requests, montar command, chamar service e mapear erros para HTTP JSON.
- **FR-005**: Services MUST receber `ApplicationContext` e command especifico.
- **FR-006**: Carteiras MUST ter nome unico por usuario, tipo obrigatorio, status ativo/inativo e saldo inicial em centavos.
- **FR-007**: Carteiras MUST ser inativadas por soft delete logico (`active=false` e `archived_at` preenchido), nunca removidas pela UI.
- **FR-008**: Tipos de carteira MUST ser `CASH`, `CREDIT_CARD`, `NEGOTIABLE_SECURITY`, `LONG_TERM` e `ASSET`, preservando compatibilidade com o schema atual.
- **FR-009**: Dinheiro MUST trafegar e persistir como inteiro em centavos.
- **FR-010**: Uma migration MUST garantir a criacao/contrato atual da tabela `wallets`.

## Domain Rules

- Wallet representa onde dinheiro, credito, ativo negociavel, compromisso de longo prazo ou bem patrimonial esta alocado.
- Wallet define elegibilidade de visoes, nao define categoria, natureza ou direcao de lancamento.
- Carteiras inativas continuam validas para historico e relatorios.
- Saldo inicial nao e fluxo de caixa operacional.

## Success Criteria

- **SC-001**: Testes de controller e service de carteira passam em `pnpm test`.
- **SC-002**: `pnpm typecheck` passa.
- **SC-003**: `pnpm lint` passa.
- **SC-004**: A UI de carteiras nao importa Server Actions.

## Extension 2026-07-14 - Saldo e detalhamento de lançamentos

### Problema

A lista de carteiras exibe somente o saldo inicial persistido. Isso faz com que
carteiras com movimentações apareçam zeradas e obriga a pessoa usuária a trocar
de tela para conferir os fatos que compõem o saldo.

### User Story 3 - Conferir saldo e lançamentos de uma carteira (Priority: P1)

Como pessoa usuária autenticada, quero ver o saldo calculado de cada carteira e
abrir seus lançamentos na própria tela, para conferir a origem de cada valor sem
perder o contexto das minhas carteiras.

**Independent Test**: o modelo de lista de carteiras soma o saldo inicial aos
lançamentos ativos, considerando `IN` positivo e `OUT` negativo.

### Acceptance Scenarios

1. **Given** uma carteira com saldo inicial e lançamentos ativos, **When** acesso
   `/wallets`, **Then** vejo o saldo calculado pela soma do saldo inicial e dos
   lançamentos `IN` e `OUT` da carteira.
2. **Given** um lançamento excluído, **When** o saldo da carteira é calculado,
   **Then** ele não altera o valor exibido.
3. **Given** uma carteira na lista, **When** clico nela, **Then** sou levado para
   `/wallets/[id]`, uma página dedicada com a lista de lançamentos daquela
   carteira: ocorrido em, categoria, descrição, natureza, evento econômico,
   valor, vínculo de transferência, anexos e edição.
4. **Given** a página de detalhe da carteira está sendo carregada, **When** a
   requisição ainda não terminou, **Then** vejo skeletons e estado acessível de
   carregamento em vez de uma área vazia.
5. **Given** abro o detalhamento de uma carteira, **When** edito, excluo,
   restauro ou altero o vínculo de um lançamento, **Then** o saldo exibido da
   carteira é atualizado sem recarregar a página inteira.

### Requirements

- **FR-011**: A UI deve usar um view model de carteira que mantenha separados o
  `Wallet` persistido, o total dos lançamentos e o saldo calculado em centavos.
- **FR-012**: O saldo calculado deve incluir somente lançamentos não excluídos;
  `IN` soma e `OUT` subtrai `amountCents`.
- **FR-013**: A lista de transações deve ser reutilizável nas telas `/transactions`
  e `/wallets/[id]`, com um modo contextual que omite controles globais da tela
  de transações, mas preserva as ações JSON existentes.
- **FR-014**: A rota `/wallets/[id]` deve ter um fallback de carregamento com
  `aria-busy`, rótulo em português e skeleton proporcional à lista.

### Out of Scope

- Alterar persistência de carteiras ou lançamentos.
- Alterar regras de fluxo de caixa operacional, liquidez ou patrimônio líquido.
