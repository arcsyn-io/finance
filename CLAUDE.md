# Finance - Personal Finance System

## Overview

Spring Boot application for personal finance management using server-side rendering with Thymeleaf and HTMX.

## Domain Model (Conceptual)

O sistema separa claramente três dimensões que NÃO se misturam:

### 1. Fluxo de Caixa Operacional
- Responde: "Minha renda operacional sustenta meu custo de vida?"
- Considera apenas: carteiras CASH + lançamentos OPERATIONAL
- Entradas: salário, pró-labore, bônus
- Saídas: alimentação, moradia, transporte, saúde, lazer
- NÃO inclui: investimentos, dividendos, rendimentos, compra/venda de ativos

### 2. Liquidez Real (Circulante)
- Responde: "Quanto dinheiro consigo mobilizar agora?"
- Considera: carteiras CASH + NEGOTIABLE_SECURITY
- É um snapshot, não um fluxo (não depende de período)

### 3. Patrimônio
- Responde: "Qual minha posição financeira total?"
- Composição: circulante + imobilizado (imóveis, bens, investimentos LP)
- Crescimento patrimonial NÃO mascara déficit operacional

### Entidades Principais

**Wallet (Carteira)** - onde o dinheiro/ativo está alocado:
- `CASH`: contas bancárias, dinheiro (fluxo de caixa)
- `NEGOTIABLE_SECURITY`: investimentos líquidos (ações, FIIs, CDI, BTC)
- `LONG_TERM`: investimentos ilíquidos (previdência, financiamento)
- `ASSET`: bens patrimoniais (imóveis, carro)

**Category (Categoria)** - significado semântico:
- type: `INCOME` ou `EXPENSE`
- Exemplos: Alimentação, Moradia, Salário
- NÃO define fluxo, liquidez ou patrimônio

**Entry (Lançamento)** - fato financeiro imutável:
- nature: `OPERATIONAL` ou `PATRIMONIAL` (sempre explícita)
- Pode aparecer em várias visões ou em nenhuma

### Regras de Ouro (não violar)
1. Fluxo de caixa ≠ dinheiro em conta
2. Investimento ≠ despesa operacional
3. Dividendo ≠ renda operacional
4. Patrimônio não corrige fluxo
5. Lançamentos são fatos, visões filtram fatos

## Tech Stack

- **Java**: 21
- **Spring Boot**: 4.0.2
- **Database**: SQLite with JOOQ (type-safe SQL)
- **Migrations**: Flyway (`src/main/resources/db/migration`)
- **Templates**: Thymeleaf + HTMX 1.9.10
- **Styling**: Pico CSS v2 (CDN, dark mode only)
- **Security**: Spring Security with session-based auth

## Commands

```bash
# Build
./mvnw clean package

# Run
./mvnw spring-boot:run

# Test
./mvnw test

# Run with test profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=test
```

## Project Structure

```
src/main/java/com/lucaskalb/finance/
├── FinanceApplication.java        # Entry point
├── config/                        # Configuration classes
├── controller/                    # Web controllers
├── service/                       # Business logic
├── repository/                    # JOOQ queries
├── model/                         # Domain models
└── dto/                           # Data transfer objects

src/main/resources/
├── application.yaml               # Main config
├── db/migration/                  # Flyway migrations (V1__description.sql)
├── static/                        # CSS, JS, images
└── templates/
    ├── layout/base.html           # Base layout with layout(content) fragment
    ├── fragments/                 # Reusable components
    └── pages/                     # Page templates
```

## Conventions

### Java (21+)

- Use `var` para variáveis locais com tipo inferido
- Preferir Streams e lambda expressions
- Usar `Optional` para retornos que podem ser nulos
- Records para DTOs imutáveis
- Pattern matching com `instanceof` e `switch`
- Text blocks para strings multiline
- Usar `List.of()`, `Map.of()`, `Set.of()` para coleções imutáveis

```java
// var
var account = accountRepository.findById(id);
var users = List.of("alice", "bob");

// Streams
var activeUsers = accounts.stream()
    .filter(Account::isEnabled)
    .map(Account::getUsername)
    .toList();

// Pattern matching
if (obj instanceof Account account) {
    return account.getUsername();
}

// Switch expressions
var status = switch (account.getStatus()) {
    case ACTIVE -> "Ativo";
    case DISABLED -> "Desativado";
    default -> "Desconhecido";
};

// Records
public record CreateAccountRequest(String username, String password) {}
```

### Controllers

- Return view names as strings
- Use `Model` for passing data to templates
- HTMX endpoints return fragments, not full pages
- Use `@GetMapping` / `@PostMapping` annotations

### Services

- `@Service` com `@RequiredArgsConstructor`
- `@Transactional(readOnly = true)` para queries
- `@Transactional` para mutações
- Validações de domínio na camada de service
- Lançar exceções customizadas para erros de negócio

### Commands (DTOs)

- Usar Java Records para commands imutáveis
- Nomenclatura: `Create{Entity}Command`, `Update{Entity}Command`
- Commands encapsulam dados de entrada para operações do service
- Localização: `dto/` package

```java
// Create command - apenas campos necessários para criação
public record CreateWalletCommand(String name, WalletType type) {}

// Update command - inclui id e todos os campos editáveis
public record UpdateWalletCommand(long id, String name, WalletType type, boolean active) {}
```

### Exceptions

- Exceções customizadas estendem `RuntimeException`
- Mensagens em português
- Nomenclatura: `{Entity}NotFoundException`, `Duplicate{Entity}NameException`, `Invalid{Entity}Exception`
- Localização: `exception/` package

### Templates

- Extend base layout: `th:replace="~{layout/base :: layout(~{::content})}"`
- Dark mode via `data-theme="dark"` on `<html>`
- Use semantic HTML (Pico CSS styles automatically)
- Mobile-first responsive design
- Flash messages via `successMessage` and `errorMessage` model attributes

### Database

- Use JOOQ for type-safe queries
- Flyway migrations: `V{number}__{description}.sql`
- SQLite dialect

### Security

- Session timeout: 30 minutes
- HTTP-only cookies with SameSite=strict

## Data Files

- Production DB: `data/finance.db`
- Test DB: `data/finance-test.db`
