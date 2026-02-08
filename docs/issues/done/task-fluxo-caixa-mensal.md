# Task: Implementação da Visão de Fluxo de Caixa Mensal

## Contexto

O sistema de finanças pessoais precisa oferecer uma **visão mensal consolidada do Fluxo de Caixa**, considerando **exclusivamente movimentações de carteiras do tipo CAIXA**.

Essa visão tem caráter **gerencial**, combinando:
- valores calculados a partir de lançamentos
- valores configuráveis pelo usuário (não lançamentos)

---

## Objetivo

Criar a funcionalidade de **Fluxo de Caixa Mensal**, permitindo ao usuário visualizar, por mês, a situação do caixa, identificar excedentes ou necessidade de resgate e configurar parâmetros financeiros essenciais.

---

## Escopo da Visão

Considerar apenas:

- Lançamentos (`entry`) onde:
  - wallet.type = CASH
  - nature = OPERATIONAL
  - **transfer_id IS NULL**

> Lançamentos originados de transferências **não devem participar**
> dos cálculos de recebimentos e despesas.

---

## Agrupadores Exibidos na Tela

A tela deve exibir uma coluna com os seguintes agrupadores, sempre no contexto de um **mês selecionado**:

### 1. Recebimentos Totais
- Soma de todos os lançamentos:
  - direction = IN
  - **excluindo transferências**

### 2. Despesas Totais
- Soma de todos os lançamentos:
  - direction = OUT
  - **excluindo transferências**

### 3. Fluxo de Caixa Líquido
- Fórmula:
  - Recebimentos Totais − Despesas Totais

### 4. Saldo de Caixa Inicial
- Valor **inputado manualmente**
- Persistido por mês
- **Não é lançamento**
- Representa o saldo disponível no início do período

### 5. Saldo de Caixa Final
- Fórmula:
  - Fluxo de Caixa Líquido + Saldo de Caixa Inicial

### 6. Caixa Mínimo
- Valor **inputado manualmente**
- Persistido por mês
- **Não é lançamento**
- Representa o limite mínimo de segurança do caixa

### 7. Saldo Excedente / Resgate Necessário
- Fórmula:
  - Saldo de Caixa Final − Caixa Mínimo
- Interpretação:
  - Valor positivo → excedente
  - Valor negativo → resgate necessário

---

## Regra Importante sobre Transferências

Transferências representam **movimentação interna de caixa** e:

- **Não são recebimentos**
- **Não são despesas**
- **Não devem inflar o fluxo de caixa mensal**

Regra obrigatória:
- Lançamentos com `transfer_id NOT NULL` **devem ser excluídos**
  dos cálculos de:
  - Recebimentos Totais
  - Despesas Totais
  - Fluxo de Caixa Líquido

Transferências impactam apenas:
- Saldos das carteiras
- Distribuição de liquidez
- Saldo de Caixa Final (indiretamente)

---

## Persistência de Configuração Mensal

Criar uma tabela auxiliar para armazenar os valores configuráveis por mês.

### Tabela: cash_flow_config

```sql
CREATE TABLE cash_flow_config (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_month      TEXT    NOT NULL, -- formato YYYY-MM
  opening_balance      INTEGER NOT NULL, -- saldo inicial em centavos
  minimum_cash         INTEGER NOT NULL, -- caixa mínimo em centavos
  created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT    NOT NULL
);

CREATE UNIQUE INDEX ux_cash_flow_config_month
  ON cash_flow_config(reference_month);
```

Regras:
- Deve existir no máximo **um registro por mês**
- Atualizações sobrescrevem o valor do mês
- Sempre persistir alterações feitas pelo usuário

---

## UI / UX

### Tela de Fluxo de Caixa Mensal

- Filtro de mês (YYYY-MM)
- Exibição dos agrupadores em formato de lista ou tabela simples
- Campos editáveis:
  - Saldo de Caixa Inicial
  - Caixa Mínimo

Ao editar valores:
- Persistir imediatamente
- Recalcular os totais
- Atualizar a tela via HTMX

---

## Backend

### Service

Criar um serviço:

- `getMonthlyCashFlow(referenceMonth)`
- `updateCashFlowConfig(referenceMonth, openingBalance, minimumCash)`

Responsabilidades:
- Agregar lançamentos do mês (excluindo transferências)
- Carregar configuração do mês
- Calcular todos os indicadores
- Garantir consistência de valores

---

## Regras de Negócio

- Apenas carteiras do tipo CASH entram no cálculo
- Transferências **não entram em recebimentos nem despesas**
- Configurações mensais **não geram lançamentos**
- Alterar saldo inicial ou caixa mínimo **não altera histórico**
- Fluxo de Caixa Mensal é uma **visão gerencial**, não contábil

---

## Critérios de Aceitação

- Usuário consegue visualizar o fluxo de caixa de qualquer mês
- Valores de entrada e saída batem com os lançamentos externos
- Transferências não distorcem o fluxo
- Saldo inicial e caixa mínimo são persistidos corretamente
- Alterações refletem imediatamente no saldo final
- Sistema identifica corretamente excedente ou necessidade de resgate

---

## Fora de Escopo

- Projeções futuras
- Fluxo de caixa diário
- Automatização de resgates

---

## Observações Arquiteturais

- Separar claramente **lançamentos** de **configuração**
- Separar claramente **fluxo externo** de **movimentação interna**
- Evitar modelar saldo inicial como lançamento fictício
- Facilita entendimento do usuário e evolução futura
