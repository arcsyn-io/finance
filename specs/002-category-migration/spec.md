# Feature Specification: Categorias

**Feature Branch**: `codex/category-migration`  
**Created**: 2026-07-08  
**Status**: Done  
**Input**: "Migrar categorias do `old/` para a stack Next.js, usando o `old/` como fonte de verdade de regra de negocio."

## User Scenarios & Testing

### User Story 1 - Listar categorias por tipo (Priority: P1)

Como usuario autenticado, quero ver minhas categorias separadas entre receitas e despesas, para administrar a semantica dos meus lancamentos.

**Why this priority**: Categorias sao dependencia central de lancamentos, transferencias, importacoes e relatorios.

**Independent Test**: Dado um conjunto de categorias ativas e inativas, listar somente ativas por padrao, ou todas quando solicitado, agrupadas por `INCOME` e `EXPENSE` e ordenadas por nome.

**Acceptance Scenarios**:

1. **Given** categorias ativas e inativas do usuario, **When** acesso `/categories`, **Then** vejo apenas categorias ativas.
2. **Given** categorias ativas e inativas do usuario, **When** acesso `/categories?showInactive=true`, **Then** vejo todas.
3. **Given** categorias de receita e despesa, **When** a tela renderiza, **Then** elas aparecem em secoes separadas.

---

### User Story 2 - Criar categoria (Priority: P1)

Como usuario autenticado, quero criar uma categoria com nome, tipo, icone e cor, para classificar lancamentos futuros com leitura visual rapida.

**Why this priority**: Criacao e o fluxo minimo para evoluir o cadastro.

**Independent Test**: Criar categoria com nome valido, tipo valido, icone e cor, verificando trim de nome, usuario dono, `active=true` por padrao e duplicidade case-insensitive.

**Acceptance Scenarios**:

1. **Given** nome `" Alimentacao "` e tipo `EXPENSE`, **When** crio a categoria, **Then** ela e salva como `"Alimentacao"`, ativa, vinculada ao usuario e com icone/cor padrao quando nao informados.
2. **Given** nome vazio, **When** crio a categoria, **Then** recebo erro `"Nome da categoria e obrigatorio"`.
3. **Given** tipo ausente ou invalido, **When** crio a categoria, **Then** recebo erro `"Tipo da categoria e obrigatorio"`.
4. **Given** categoria existente `"Salario"`, **When** crio `"salario"`, **Then** recebo erro de duplicidade.

---

### User Story 3 - Atualizar categoria (Priority: P1)

Como usuario autenticado, quero editar nome, tipo, icone, cor e status de uma categoria, para corrigir ou reorganizar meu cadastro.

**Why this priority**: O `old/` permite atualizar os tres campos e esse comportamento precisa ser preservado.

**Independent Test**: Atualizar categoria existente, validando nome/tipo, preservando icone e cor enviados, duplicidade ignorando o proprio registro e erro quando o id nao existe.

**Acceptance Scenarios**:

1. **Given** categoria existente, **When** atualizo nome, tipo, icone, cor e active, **Then** os campos sao persistidos.
2. **Given** categoria inexistente, **When** tento atualizar, **Then** recebo erro `"Categoria nao encontrada"`.
3. **Given** outra categoria com nome equivalente case-insensitive, **When** atualizo para esse nome, **Then** recebo erro de duplicidade.

---

### User Story 4 - Ativar e desativar categoria (Priority: P2)

Como usuario autenticado, quero desativar e reativar categorias, para ocultar categorias que nao uso sem apagar historico.

**Why this priority**: O `old/` usa status ativo/inativo em vez de delete.

**Independent Test**: Alternar status de categoria existente e retornar erro quando a categoria nao existir.

**Acceptance Scenarios**:

1. **Given** categoria ativa, **When** desativo, **Then** `active=false`.
2. **Given** categoria inativa, **When** ativo, **Then** `active=true`.
3. **Given** categoria inexistente, **When** tento ativar/desativar, **Then** recebo erro `"Categoria nao encontrada"`.

## Requirements

### Functional Requirements

- **FR-001**: O sistema MUST tratar o `old/` como fonte de verdade de regra de negocio de categoria.
- **FR-002**: Categoria MUST possuir `id`, `userId`, `name`, `type`, `icon`, `color`, `active`, `createdAt`, `updatedAt` e `archivedAt`.
- **FR-003**: `type` MUST aceitar somente `INCOME` e `EXPENSE`.
- **FR-004**: Criacao MUST normalizar `name` com `trim()`.
- **FR-005**: Criacao e atualizacao MUST rejeitar `name` nulo, vazio ou somente espacos.
- **FR-006**: Criacao e atualizacao MUST rejeitar `type` ausente ou invalido.
- **FR-007**: Nomes MUST ser unicos por usuario de forma case-insensitive.
- **FR-008**: Atualizacao MUST permitir manter o proprio nome sem disparar duplicidade.
- **FR-009**: Listagem padrao MUST retornar apenas categorias ativas.
- **FR-010**: Listagem com `showInactive=true` MUST retornar categorias ativas e inativas.
- **FR-011**: Listagens MUST ordenar por nome.
- **FR-012**: Operacoes de escrita MUST usar `ApplicationContext` e Unit of Work.
- **FR-013**: Services MUST receber apenas `ApplicationContext` e command especifico.
- **FR-014**: Repositories MUST receber `ApplicationContext` e resolver o client pelo `TransactionContext`.
- **FR-015**: A tela `/categories` MUST permitir criar, editar, ativar e desativar categorias.
- **FR-016**: Tabelas financeiras protegidas por RLS MUST conceder privilegios SQL explicitos ao role `authenticated`, mantendo o isolamento por usuario nas policies.
- **FR-017**: Categoria MUST possuir `icon` e `color` para exibicao visual em badges.
- **FR-018**: Criacao MUST atribuir icone `Tag` e cor padrao por tipo quando `icon` ou `color` nao forem informados.
- **FR-019**: Atualizacao MUST persistir `icon` e `color` quando informados e preservar os valores existentes quando omitidos.
- **FR-020**: A tela `/categories` MUST exibir cada categoria como badge com icone, nome e cor.
- **FR-021**: O formulario inline de categoria MUST permitir escolher icone por popover, cor por swatches e status por switch.
- **FR-022**: A tela `/categories` MUST atualizar a lista localmente apos criar, editar, mover, ativar ou desativar categoria, sem recarregar automaticamente para reordenar por nome.
- **FR-023**: Mensagens de sucesso e erro de interacoes do sistema MUST ser exibidas em toaster suspenso reutilizavel, sem ocupar espaco fixo no layout da pagina.

### Key Entities

- **Category**: Entidade de dominio para categoria financeira.
- **CategoryType**: Enum de dominio `INCOME | EXPENSE`.
- **CreateCategoryCommand**: Intencao de criar categoria.
- **UpdateCategoryCommand**: Intencao de atualizar categoria.
- **SetCategoryActiveCommand**: Intencao de alterar status ativo.

## Success Criteria

- **SC-001**: Testes unitarios cobrem validacao, duplicidade, update e ativar/desativar.
- **SC-002**: `pnpm test` passa.
- **SC-003**: `pnpm typecheck` passa.
- **SC-004**: `pnpm lint` passa.
- **SC-005**: PR e aberto com a implementacao.
