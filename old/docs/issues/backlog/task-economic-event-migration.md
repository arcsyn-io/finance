# Task – Introdução de Evento Econômico + Migration de Backfill

## Objetivo
Introduzir o conceito explícito de **Evento Econômico** nos lançamentos financeiros (`entry`) e ajustar os registros já existentes na base de dados por meio de uma migration com backfill lógico e conservador.

---

## Contexto
O modelo atual utiliza:
- `nature` (OPERATIONAL | PATRIMONIAL)
- `direction` (IN | OUT)
- `wallet.type`
- `category` (obrigatória)
- `transfer_id`

Esses campos não são suficientes para distinguir corretamente consumo, liquidação, investimento e transferência, gerando vazamento semântico entre visões.

---

## Decisão
Adicionar o campo **economic_event** em `entry`, representando explicitamente o significado econômico do lançamento.

### Valores possíveis
- CONSUMPTION
- LIQUIDATION
- INVESTMENT
- TRANSFER

---

## Migration – Alteração de Schema

```sql
ALTER TABLE entry
ADD COLUMN economic_event TEXT
CHECK (
  economic_event IN (
    'CONSUMPTION',
    'LIQUIDATION',
    'INVESTMENT',
    'TRANSFER'
  )
);
```

---

## Migration – Backfill de Dados

### Transferências
```sql
UPDATE entry
SET economic_event = 'TRANSFER'
WHERE transfer_id IS NOT NULL;
```

### Investimentos
```sql
UPDATE entry
SET economic_event = 'INVESTMENT'
WHERE economic_event IS NULL
  AND wallet_id IN (
    SELECT id FROM wallet
    WHERE type IN ('NEGOTIABLE_SECURITY', 'LONG_TERM', 'ASSET')
  );
```

### Liquidações
```sql
UPDATE entry
SET economic_event = 'LIQUIDATION'
WHERE economic_event IS NULL
  AND nature = 'OPERATIONAL'
  AND direction = 'OUT'
  AND wallet_id IN (
    SELECT id FROM wallet WHERE type = 'CASH'
  );
```

### Consumo (residual)
```sql
UPDATE entry
SET economic_event = 'CONSUMPTION'
WHERE economic_event IS NULL
  AND direction = 'OUT';
```

### Entradas restantes
```sql
UPDATE entry
SET economic_event = 'INVESTMENT'
WHERE economic_event IS NULL
  AND direction = 'IN';
```

---

## Validação
```sql
SELECT economic_event, COUNT(*) FROM entry GROUP BY economic_event;
SELECT * FROM entry WHERE economic_event IS NULL;
```

---

## Ajustes nos Cadastros
- Incluir campo **Evento Econômico** no cadastro manual
- Sugerir valor automaticamente com base em carteira, natureza e direção
- Permitir ajuste manual
- Tornar o campo obrigatório para novos lançamentos

---

## Critérios de Aceitação
- Todos os lançamentos possuem `economic_event`
- Visões utilizam exclusivamente `economic_event`
- Consumo, liquidação, investimento e transferência não se misturam
