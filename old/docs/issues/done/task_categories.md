# Task: Implementar entidade Category (categoria), CRUD e telas

## Contexto

Sistema pessoal de finanças com visões separadas (fluxo de caixa operacional, liquidez e patrimônio).  
A entidade **Category** representa o significado semântico de um lançamento (ex.: Alimentação, Moradia, Salário).  
Category **não define comportamento sistêmico** (não decide se entra no fluxo, não decide impacto patrimonial).

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

## Objetivo

Implementar **Category** com:
- schema (Flyway)
- jOOQ + repository/DAO explícito
- service com validações de domínio
- controller MVC
- telas: listar, criar, editar
- desativar (soft delete)

## Modelo de domínio

### Category

Campos:
- id: long
- name: string
- type: enum `INCOME | EXPENSE`
- active: boolean
- createdAt: datetime (opcional no domínio, mas persistido no BD)

Regras (invariantes):
- name é obrigatório (trim, não vazio)
- name é único (case-insensitive se possível; caso não, ao menos unique simples e validação no service)
- type é obrigatório
- não permitir delete físico (somente desativação)

## Banco de dados (Flyway)

Criar migration: `VXXX__create_category.sql`

DDL base (SQLite):

```sql
CREATE TABLE category (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  type       TEXT    NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX ux_category_name ON category(name);
```

Notas:
- `active` como INTEGER 0/1 (SQLite).
- Se quiser unique case-insensitive: usar `COLLATE NOCASE` no campo ou índice (opcional).

## Backend

### DAO/jOOQ

Criar `CategoryRepository` (ou `CategoryDao`) com operações:

- `List<Category> listAll(Boolean includeInactive)`
- `Optional<Category> findById(long id)`
- `Optional<Category> findByName(String name)` (para validação)
- `long insert(String name, CategoryType type)`
- `void update(long id, String name, CategoryType type, boolean active)`
- `void setActive(long id, boolean active)`

### Service

Criar `CategoryService` com:

- `List<Category> listActive()`
- `List<Category> listAll()`
- `Category create(String name, CategoryType type)`
- `Category update(long id, String name, CategoryType type, boolean active)`
- `void deactivate(long id)` (active=false)

Validações obrigatórias no service:
- name: `trim()`, não vazio
- type: não nulo
- name único:
    - ao criar: não existir outra category com o mesmo name
    - ao editar: não permitir name duplicado em outro id
- ao editar/desativar: id deve existir (senão 404/erro de domínio)

Erros:
- retornar mensagens de validação para a view (ex.: `BindingResult` ou um DTO de formulário com erros).

## Controllers (Spring MVC)

Rotas:

- `GET  /categories`  
  Lista categorias (padrão: apenas ativas; opcional: checkbox "mostrar inativas")

- `GET  /categories/new`  
  Form de criação

- `POST /categories`  
  Cria categoria

- `GET  /categories/{id}`  
  Form de edição

- `POST /categories/{id}`  
  Atualiza categoria (name, type, active)

- `POST /categories/{id}/deactivate`  
  Desativa (HTMX)

## Telas (Thymeleaf + Pico + HTMX)

### 1) Lista: `/categories`

Componentes:
- Header: "Categorias"
- Botão "Nova categoria" (link para `/categories/new`)
- (Opcional) toggle "Mostrar inativas"
- Tabela com colunas:
    - Nome
    - Tipo (INCOME/EXPENSE)
    - Status (Ativa/Inativa)
    - Ações: Editar, Desativar (se ativa)

HTMX:
- Botão "Desativar" faz `POST /categories/{id}/deactivate`
- Resposta atualiza a linha ou recarrega a tabela (partial).

### 2) Formulário: criar/editar

Campos:
- Nome (input text)
- Tipo (select com INCOME/EXPENSE)
- Ativa (checkbox) — somente na edição (ou em ambos, se preferir)

Regras:
- server-side validation com mensagens no topo do form e/ou abaixo dos campos
- CSRF presente
- sem JS custom

## Fora de escopo

- Natureza do lançamento (EntryNature)
- Relacionamento Category -> Entry
- Importação OFX/corretoras
- Regras automáticas de categorização

## Critérios de aceite

- Migration aplicada e tabela criada
- CRUD completo funcional (listar, criar, editar)
- Desativação funciona (soft delete)
- Validações:
    - name obrigatório
    - name único
    - type obrigatório
- UI simples com Pico.css dark e HTMX apenas para partials
- SQL explícito via jOOQ, sem ORM
