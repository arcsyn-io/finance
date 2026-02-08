# Task: Implementação de Transferência entre Carteiras

## Contexto

O sistema de finanças pessoais precisa suportar **transferências internas entre carteiras**, mantendo a coerência do modelo de **fluxo de caixa operacional**.

Uma transferência **não representa consumo nem receita**, apenas movimentação interna de saldo entre carteiras.

---

## Objetivo

Adicionar a funcionalidade de **Transferência entre Carteiras** na tela de lançamentos, permitindo ao usuário mover valores entre carteiras de forma explícita, rastreável e consistente com o modelo financeiro.

---

## Requisitos Funcionais

### 1. UI – Novo Lançamento

No dropdown **“Novo Lançamento”**, adicionar a opção:

- **Transferência**

Ao selecionar essa opção:

- Abrir um **modal lateral à direita**
- Exibir um **formulário de criação de transferência**

---

### 2. Formulário de Transferência

Campos obrigatórios:

#### Origem
- Carteira de origem (select)
- Categoria de origem (select)

#### Destino
- Carteira de destino (select)
- Categoria de destino (select)

#### Dados comuns
- Valor (em moeda, convertido para centavos)
- Data de ocorrência
- Descrição (opcional)

Validações:
- Carteira de origem ≠ carteira de destino
- Valor > 0
- Data obrigatória

---

## Modelo de Dados

### Entidade: Transfer

Criar uma entidade explícita para representar a transferência.

Exemplo de tabela:

```sql
CREATE TABLE transfer (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  from_wallet_id  INTEGER NOT NULL,
  to_wallet_id    INTEGER NOT NULL,
  amount          INTEGER NOT NULL CHECK (amount > 0),
  occurred_at     TEXT    NOT NULL,
  description     TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (from_wallet_id) REFERENCES wallet(id),
  FOREIGN KEY (to_wallet_id)   REFERENCES wallet(id)
);
```

---

## Integração com Lançamentos

### Regra Central

**Toda transferência deve gerar exatamente dois lançamentos operacionais**:

1. **Saída da carteira de origem**
2. **Entrada na carteira de destino**

Ambos vinculados à mesma transferência.

---

### Lançamento de Saída

- wallet_id = carteira de origem
- category_id = categoria de origem
- nature = OPERATIONAL
- direction = OUT
- amount = valor
- occurred_at = data da transferência
- description = descrição da transferência

---

### Lançamento de Entrada

- wallet_id = carteira de destino
- category_id = categoria de destino
- nature = OPERATIONAL
- direction = IN
- amount = valor
- occurred_at = data da transferência
- description = descrição da transferência

---

### Vínculo

Adicionar uma coluna opcional em `entry`:

```sql
ALTER TABLE entry ADD COLUMN transfer_id INTEGER;
```

- Ambos os lançamentos devem ter o mesmo `transfer_id`
- Lançamentos de transferência **não podem existir sem a transferência**
- Exclusão deve ser lógica ou transacional

---

## Regras de Negócio

- Transferência **não afeta consumo por competência**
- Transferência **afeta apenas saldos de carteiras**
- Transferência **não pode gerar saldo negativo se a regra da carteira impedir**
- Transferência é sempre **OPERATIONAL**

---

## Backend

### Service

Criar um serviço transacional:

- `createTransfer(command)`

Responsabilidades:
- Validar regras
- Criar registro em `transfer`
- Criar os dois lançamentos vinculados
- Garantir atomicidade (transaction)

---

## UI / UX

- Modal lateral consistente com padrão existente
- Confirmação clara antes de salvar
- Após sucesso:
  - Fechar modal
  - Atualizar listagem de lançamentos via HTMX

---

## Critérios de Aceitação

- Usuário consegue transferir saldo entre duas carteiras
- Saldo das carteiras é atualizado corretamente
- Dois lançamentos são criados e vinculados
- Transferência não aparece como consumo
- Remoção/edição futura pode ser feita via entidade `transfer`

---

## Fora de Escopo

- Transferências agendadas
- Transferências recorrentes
- Transferências entre usuários

---

## Observações Arquiteturais

- Transferência é um **conceito explícito de domínio**
- Evitar modelar como dois lançamentos soltos
- Facilita auditoria, explicação de saldo e evolução futura
