# Finance - Personal Finance System

## Overview

Spring Boot application for personal finance management using server-side rendering with Thymeleaf and HTMX.

## Domain Model

The system separates three dimensions that must not be mixed:

### 1. Operational Cash Flow

- Answers: "Does operational income sustain cost of living?"
- Considers only: CASH wallets + OPERATIONAL entries.
- Examples: salary, pro-labore, bonus, food, housing, transport, health, leisure.
- Does not include investments, dividends, yields, or asset buy/sell operations.

### 2. Real Liquidity

- Answers: "How much money can be mobilized now?"
- Considers: CASH + NEGOTIABLE_SECURITY wallets.
- It is a snapshot, not a period flow.

### 3. Net Worth

- Answers: "What is the total financial position?"
- Composition: liquid assets + fixed/long-term assets.
- Net worth growth must not hide operational deficit.

## Main Entities

### Wallet

Where money or assets are allocated:

- `CASH`: bank accounts and cash.
- `NEGOTIABLE_SECURITY`: liquid investments.
- `LONG_TERM`: illiquid investments.
- `ASSET`: wealth assets such as real estate and vehicles.

### Category

Semantic meaning:

- `INCOME` or `EXPENSE`.
- Examples: Food, Housing, Salary.
- Does not define flow, liquidity, or net worth.

### Entry

Immutable financial fact:

- `nature`: `OPERATIONAL` or `PATRIMONIAL`.
- `direction`: `IN` or `OUT`.
- `amount`: value in cents as integer. Never decimal/float.
- Real/cents conversion happens only at boundaries.
- Soft delete via `deleted_at`.
- Deleted entries can be restored.
- An entry may appear in many views or none.

## Golden Rules

1. Cash flow is not account balance.
2. Investment is not operational expense.
3. Dividend is not operational income.
4. Net worth does not fix cash flow.
5. Entries are facts; views filter facts.

## Tech Stack

- Java 21
- Spring Boot 4.0.2
- SQLite with JOOQ
- Flyway migrations in `src/main/resources/db/migration`
- Thymeleaf + HTMX 1.9.10
- Pico CSS v2
- Spring Security with session-based auth

## Commands

```bash
./mvnw clean package
./mvnw spring-boot:run
./mvnw test
./mvnw spring-boot:run -Dspring-boot.run.profiles=test
```

On Windows, use `.\mvnw.cmd` instead of `./mvnw`.

## Project Structure

```text
src/main/java/com/lucaskalb/finance/
|-- FinanceApplication.java
|-- config/
|-- controller/
|-- service/
|-- repository/
|-- model/
`-- dto/

src/main/resources/
|-- application.yaml
|-- db/migration/
|-- static/
`-- templates/
    |-- layout/base.html
    |-- fragments/
    `-- pages/
```

## Java Conventions

- Use `var` for local variables when clear.
- Prefer Streams and lambda expressions where useful.
- Use `Optional` for nullable returns.
- Use records for immutable DTOs.
- Use pattern matching with `instanceof` and `switch` where appropriate.
- Use text blocks for multiline strings.
- Use `List.of()`, `Map.of()`, and `Set.of()` for immutable collections.

## Controllers

- HTMX is the premise: all async calls are HTMX.
- Do not use `-htmx` suffix in endpoint names.
- Return view names as strings.
- Use `Model` for template data.
- Form endpoints return fragments, not full pages.
- Use `@GetMapping` and `@PostMapping`.

## Services

- Use `@Service` with `@RequiredArgsConstructor`.
- Use `@Transactional(readOnly = true)` for queries.
- Use `@Transactional` for mutations.
- Keep domain validation in services.
- Throw custom business exceptions.

## Commands DTOs

- Use Java records.
- Naming: `Create{Entity}Command`, `Update{Entity}Command`.
- Store under the `dto` package.

## Exceptions

- Custom exceptions extend `RuntimeException`.
- Messages are in Portuguese.
- Naming: `{Entity}NotFoundException`, `Duplicate{Entity}NameException`, `Invalid{Entity}Exception`.
- Store under the `exception` package.

## Templates

- Extend base layout with `th:replace="~{layout/base :: layout(~{::content})}"`.
- Dark mode via `data-theme="dark"` on `<html>`.
- Use semantic HTML.
- Prefer mobile-first responsive design.
- Icons: Font Awesome 6 via CDN.

## UI Components

### Sidebar forms

- Opens on the right via HTMX.
- `hx-get` loads fragments into `#sidebarContent`.
- Submit uses `hx-post`.
- On success, use `HX-Redirect`.
- On error, return the form fragment with `errorMessage` and previous values.

### Toasts

- Floating at top-right.
- Auto-close after 4 seconds.
- Types: `toast-success`, `toast-error`.
- Flash messages use `HttpSession`.
- Do not use query params for flash messages.

### Tables with actions

- Use icon buttons with Font Awesome.
- Edit: `fa-pen-to-square`.
- Delete/deactivate: `fa-trash`.
- Restore/activate: `fa-rotate-left`.
- Use HTMX inline actions with `hx-target="closest tr"`.

## HTMX Patterns

- All interactive calls are HTMX.
- Do not put technology names in endpoint paths.
- Successful forms generally set flash message and `HX-Redirect`.
- Failed forms return a fragment and keep the current UI open.

## Database

- Use JOOQ for type-safe queries.
- Flyway migrations use `V{number}__{description}.sql`.
- SQLite dialect.

## Security

- Session timeout: 30 minutes.
- HTTP-only cookies with SameSite strict.

## Data Files

- Production DB: `data/finance.db`
- Test DB: `data/finance-test.db`
