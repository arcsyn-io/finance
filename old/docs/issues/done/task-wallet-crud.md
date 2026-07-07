# Task: Implementar entidade Wallet (carteiras), CRUD e telas

## Contexto

Sistema pessoal de finanças com separação clara entre:
- fluxo de caixa operacional
- liquidez real (circulante)
- patrimônio

A entidade **Wallet** representa onde o dinheiro ou ativo está alocado.
Carteiras **não possuem comportamento contábil automático**; seu papel é definir
**elegibilidade de participação nas visões** (fluxo, liquidez, patrimônio).

---

## Objetivo

Implementar **Wallet** com:
- schema (Flyway)
- jOOQ + repository/DAO explícito
- service com validações de domínio
- controller MVC
- telas: listar, criar, editar seguindo o modelo existente
- ativar/desativar (soft delete)

---

## Modelo de domínio

### Wallet

Campos:
- id: long
- name: string
- type: enum `CASH | NEGOTIABLE_SECURITY | LONG_TERM | ASSET`
- active: boolean
- createdAt: datetime (persistido no BD)

Semântica dos tipos:
- CASH: contas bancárias, dinheiro disponível
- NEGOTIABLE_SECURITY: investimentos com liquidez imediata (ações, FIIs, CDI, BTC)
- LONG_TERM: investimentos ou compromissos de longo prazo (previdência, financiamento)
- ASSET: bens patrimoniais (imóveis quitados, carro, etc.)

---

## Regras de domínio (invariantes)

- Toda carteira deve ter nome único
- Toda carteira deve ter exatamente um tipo
- Carteiras não são deletadas fisicamente
- Carteiras inativas:
  - não podem receber novos lançamentos
  - continuam válidas para histórico e relatórios
- Carteira não define:
  - categoria
  - natureza do lançamento
  - direction do lançamento

---

## Banco de dados (Flyway)

Criar migration: `VXXX__create_wallet.sql`

DDL base (SQLite):

```sql
CREATE TABLE wallet (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  type       TEXT    NOT NULL CHECK (
               type IN ('CASH', 'NEGOTIABLE_SECURITY', 'LONG_TERM', 'ASSET')
             ),
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX ux_wallet_name ON wallet(name);
```

---

## Backend

### DAO/jOOQ

Criar `WalletRepository` (ou `WalletDao`) com operações:

- `List<Wallet> listAll(Boolean includeInactive)`
- `Optional<Wallet> findById(long id)`
- `Optional<Wallet> findByName(String name)`
- `long insert(String name, WalletType type)`
- `void update(long id, String name, WalletType type, boolean active)`
- `void setActive(long id, boolean active)`

---

### Service

Criar `WalletService` com:

- `List<Wallet> listActive()`
- `List<Wallet> listAll()`
- `Wallet create(String name, WalletType type)`
- `Wallet update(long id, String name, WalletType type, boolean active)`
- `void deactivate(long id)`
- `void activate(long id)`

Validações obrigatórias:
- name:
  - obrigatório
  - `trim()`
  - único
- type:
  - obrigatório
- id deve existir para update/activate/deactivate
- impedir alteração de tipo se houver lançamentos associados (opcional, mas recomendado)

---

## Controllers (Spring MVC)

Rotas:

- `GET  /wallets`
  Lista carteiras (padrão: apenas ativas; opcional: mostrar inativas)

- `GET  /wallets/new`
  Form de criação

- `POST /wallets`
  Criar carteira

- `GET  /wallets/{id}`
  Form de edição

- `POST /wallets/{id}`
  Atualizar carteira

- `POST /wallets/{id}/deactivate`
  Desativar carteira (HTMX)

- `POST /wallets/{id}/activate`
  Reativar carteira (HTMX)

---

## Telas (Thymeleaf + Pico + HTMX)

### 1) Lista: `/wallets`

Componentes:
- Header: "Carteiras"
- Botão "Nova carteira"
- (Opcional) toggle "Mostrar inativas"
- Tabela com colunas:
  - Nome
  - Tipo
  - Status (Ativa/Inativa)
  - Ações: Editar, Desativar / Ativar

HTMX:
- Ações de ativar/desativar com POST
- Atualização parcial da tabela ou linha

---

### 2) Formulário: criar/editar

Campos:
- Nome (input text)
- Tipo (select):
  - CASH
  - NEGOTIABLE_SECURITY
  - LONG_TERM
  - ASSET
- Ativa (checkbox apenas na edição)

Regras:
- mesmo template para create/edit
- validações server-side
- mensagens claras
- CSRF habilitado
- sem JavaScript custom

---

## Fora de escopo

- Lançamentos (Entry)
- Cálculo de saldo
- Fluxo de caixa
- Liquidez
- Importações (OFX, corretora, cartão)

---

## Critérios de aceite

- Migration aplicada corretamente
- CRUD funcional end-to-end
- Soft delete funcionando
- Validações de domínio aplicadas
- UI simples, consistente e escura (Pico.css)
- Uso de jOOQ com SQL explícito
- Sem ORM, sem REST público, sem SPA
