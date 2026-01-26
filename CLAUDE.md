# Finance - Personal Finance System

## Overview

Spring Boot application for personal finance management using server-side rendering with Thymeleaf and HTMX.

## Tech Stack

- **Java**: 21
- **Spring Boot**: 4.0.2
- **Database**: SQLite with JOOQ (type-safe SQL)
- **Migrations**: Flyway (`src/main/resources/db/migration`)
- **Templates**: Thymeleaf + HTMX 1.9.10
- **Styling**: Tailwind CSS (CDN, dark mode only)
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

### Controllers

- Return view names as strings
- Use `Model` for passing data to templates
- HTMX endpoints return fragments, not full pages
- Use `@GetMapping` / `@PostMapping` annotations

### Templates

- Extend base layout: `th:replace="~{layout/base :: layout(~{::content})}"`
- Dark mode only with Tailwind classes
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
