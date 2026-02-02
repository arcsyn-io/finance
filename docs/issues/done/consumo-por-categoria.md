# Tarefa: Visão de Consumo por Categoria (Regime de Competência)

## Objetivo

Implementar uma visão analítica de **consumo por categoria**, baseada exclusivamente em lançamentos **patrimoniais por competência**, permitindo ao usuário entender onde o dinheiro foi consumido, independentemente de pagamento, carteira ou fluxo de caixa.

Essa visão responde perguntas como:
- Quanto consumi em cada categoria no período?
- Qual categoria concentrou maior parte do consumo?
- Como o consumo se distribui entre categorias?

---

## Modelo de Dados de Referência

Tabela utilizada:

```sql
CREATE TABLE entry (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id    INTEGER NOT NULL,
  category_id  INTEGER NOT NULL,
  nature       TEXT    NOT NULL CHECK (nature IN ('OPERATIONAL', 'PATRIMONIAL')),
  direction    TEXT    NOT NULL CHECK (direction IN ('IN', 'OUT')),
  amount       INTEGER NOT NULL CHECK (amount > 0),
  occurred_at  TEXT    NOT NULL,
  description  TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_id)   REFERENCES wallet(id),
  FOREIGN KEY (category_id) REFERENCES category(id)
);

CREATE INDEX ix_entry_wallet   ON entry(wallet_id);
CREATE INDEX ix_entry_category ON entry(category_id);
CREATE INDEX ix_entry_date     ON entry(occurred_at);
```

---

## Definições de Negócio

### O que é Consumo

Um lançamento é considerado **consumo** se, e somente se:

- `nature = 'PATRIMONIAL'`
- `direction = 'OUT'`
- Possui `category_id`
- Está dentro do período selecionado (`occurred_at`)

Observações:
- `amount` é sempre positivo (em centavos)
- Pagamentos, transferências e quitações são `OPERATIONAL` e não entram na visão
- Cartão de crédito não interfere nessa visão

---

## Dimensão Temporal (Competência)

- A competência é representada pelo campo `occurred_at`
- O sistema não diferencia ocorrência de competência neste estágio

Filtros suportados:
- Mês/Ano (default: mês atual)
- Intervalo customizado (data inicial e final)

---

## Query de Referência (SQLite)

```sql
SELECT
    c.id   AS category_id,
    c.name AS category_name,
    SUM(e.amount) AS total_consumed
FROM entry e
JOIN category c ON c.id = e.category_id
WHERE e.nature = 'PATRIMONIAL'
  AND e.direction = 'OUT'
  AND e.occurred_at >= :start_date
  AND e.occurred_at <  :end_date
GROUP BY c.id, c.name
ORDER BY total_consumed DESC;
```

---

## Métricas Derivadas (Service Layer)

- Total geral do período
- Percentual por categoria

---

## Escopo de UI / UX

- Filtro de período (componente igual ao usado na tela de lançamentos com opções ultimo semestre, ultimo ano)
- Resumo geral 
- Tabela com valores agrupados por categoria mês a mês

---

## Fora de Escopo

- Planejamento
- Metas
- Comparações históricas
- Previsões
- Ledger double-entry

---

## Critérios de Aceitação

- Apenas lançamentos `PATRIMONIAL + OUT`
- Total geral consistente
- Independente de caixa e carteiras
