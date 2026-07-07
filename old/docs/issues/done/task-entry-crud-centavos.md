# Task: Implementar entidade Entry (lançamentos), CRUD e telas

## Contexto

Sistema pessoal de finanças com separação explícita entre:
- fluxo de caixa operacional
- liquidez real (circulante)
- patrimônio

A entidade **Entry** representa um fato financeiro imutável.
Lançamentos não possuem lógica de visão; eles são filtrados posteriormente
pelas visões (fluxo de caixa, liquidez e patrimônio).

**Regra importante**: valores monetários são sempre representados como
**inteiros em centavos**, nunca como decimal/float.

Stack obrigatória:
- Java 21
- Spring Boot
- Spring MVC (HTML server-side)
- Spring Security (session, form login, CSRF)
- jOOQ (SQL explícito)
- SQLite em arquivo
- Flyway
- Thymeleaf
- HTMX
- Pico.css (dark mode)

---

## Objetivo

Implementar **Entry** com:
- schema de banco (Flyway)
- acesso a dados via jOOQ
- service com invariantes de domínio
- controller MVC
- telas administrativas (listar, criar, visualizar/editar)
- classificação explícita por Categoria e Natureza
- valores em centavos (INTEGER)
- sem delete físico

---

## Modelo de Domínio

### Entry

Campos:
- id: long
- walletId: long
- categoryId: long
- nature: enum OPERATIONAL | PATRIMONIAL
- direction: enum IN | OUT
- amount: long (valor em centavos, sempre positivo)
- occurredAt: datetime
- description: string (opcional)
- createdAt: datetime

Observações:
- `amount` representa **centavos**
- nunca usar BigDecimal/Double no domínio
- conversão real ↔ centavos acontece apenas na borda (controller/view)

---

## Regras de Domínio (Invariantes)

- Todo lançamento pertence a uma carteira existente
- Todo lançamento pertence a uma categoria existente
- Todo lançamento possui natureza explícita
- `amount` deve ser maior que zero
- `direction` deve ser coerente com `Category.type`:
  - INCOME → IN
  - EXPENSE → OUT
- Carteiras inativas não podem receber lançamentos
- Lançamentos são fatos:
  - soft delete via `deleted_at` (não delete físico)
  - edição permitida apenas para correção explícita
  - restauração de lançamentos excluídos permitida

---

## Banco de Dados (Flyway)

Criar migration: `VXXX__create_entry.sql`

DDL base (SQLite):

```sql
CREATE TABLE entry (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id    INTEGER NOT NULL,
  category_id  INTEGER NOT NULL,
  nature       TEXT    NOT NULL CHECK (nature IN ('OPERATIONAL', 'PATRIMONIAL')),
  direction    TEXT    NOT NULL CHECK (direction IN ('IN', 'OUT')),
  amount       INTEGER NOT NULL CHECK (amount > 0), -- valor em centavos
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

Notas:
- `amount` é INTEGER (centavos)
- Não usar NUMERIC/DECIMAL/FLOAT
- Não usar ON DELETE CASCADE

---

## Backend

### DAO / jOOQ

Criar `EntryRepository` (ou `EntryDao`) com operações:

- `List<Entry> listByPeriod(startDate, endDate)`
- `Optional<Entry> findById(id)`
- `long insert(CreateEntryCommand cmd)`
- `void update(UpdateEntryCommand cmd)` (se permitir edição)
- consultas auxiliares por carteira, categoria e natureza

---

### Service

Criar `EntryService` com:

- `Entry create(CreateEntryCommand cmd)`
- `Entry update(UpdateEntryCommand cmd)` (opcional)
- `Entry getById(id)`
- `List<Entry> list(FilterCriteria criteria)`

Validações obrigatórias:
- carteira existe e está ativa
- categoria existe
- natureza obrigatória
- amount > 0
- direction coerente com category.type
- occurredAt obrigatório

---

## Controllers (Spring MVC)

Rotas:

- GET  /entries  
  Lista lançamentos (filtros: período, carteira, categoria, natureza)

- GET  /entries/new  
  Formulário de criação

- POST /entries  
  Criar lançamento

- GET  /entries/{id}  
  Visualizar / editar (se permitido)

- POST /entries/{id}  
  Atualizar (opcional)

---

## Telas (Thymeleaf + Pico + HTMX)

### Lista de lançamentos

- Filtros:
  - período (data inicial e final)
  - carteira
  - categoria
  - natureza
- Tabela:
  - Data
  - Carteira
  - Categoria
  - Natureza
  - Direção
  - Valor (formatado em reais na view)
  - Descrição
  - Ação: visualizar / editar

HTMX:
- filtros atualizam tabela parcialmente
- paginação simples opcional

---

### Formulário de lançamento

Campos:
- Data
- Carteira (select)
- Categoria (select)
- Natureza (select OPERATIONAL | PATRIMONIAL)
- Valor (input em reais, convertido para centavos no controller)
- Descrição (opcional)

Regras de UI:
- `direction` é inferida pela categoria (não editável)
- conversão real → centavos na borda
- validações server-side
- CSRF habilitado
- sem JavaScript customizado

---

## Fora de Escopo

- Importação OFX
- Transferências automáticas entre carteiras
- Split de lançamentos
- Double-entry contábil

---

## Critérios de Aceite

- Migration aplicada corretamente
- CRUD funcional end-to-end
- Valores persistidos em centavos (INTEGER)
- Invariantes de domínio respeitadas
- Nenhum delete físico de lançamentos
- UI simples e consistente (Pico.css)
- SQL explícito via jOOQ
- Sem ORM, sem REST público, sem SPA
