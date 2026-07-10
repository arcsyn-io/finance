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
