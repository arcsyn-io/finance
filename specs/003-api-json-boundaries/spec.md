# Feature Specification: Bordas HTTP JSON

**Feature Branch**: `codex/api-json-boundaries`  
**Created**: 2026-07-08  
**Status**: Draft  
**Input**: "altere para usar api json em vez de actions nesse projeto"

## User Scenarios & Testing

### User Story 1 - Mutacoes de categoria via API JSON (Priority: P1)

Como usuario autenticado, quero que criacao, edicao, ativacao e desativacao de categorias usem endpoints HTTP JSON, para evitar dependencia de Server Actions.

**Independent Test**: Controller de categoria recebe objetos JSON, valida request, chama service com `ApplicationContext` e retorna status/body previsiveis.

**Acceptance Scenarios**:

1. **Given** nome e tipo validos, **When** envio `POST /api/categories`, **Then** a categoria e criada e a resposta JSON indica sucesso.
2. **Given** dados invalidos, **When** envio JSON para uma mutacao de categoria, **Then** a resposta JSON retorna erro em portugues com status 400.
3. **Given** categoria inexistente, **When** atualizo ou altero status, **Then** a resposta JSON retorna status 404.

### User Story 2 - Autenticacao e MFA via API JSON (Priority: P1)

Como usuario, quero que login e verificacoes MFA usem endpoints HTTP JSON, para manter o frontend sem Server Actions.

**Independent Test**: Formularios client-side enviam JSON para APIs e redirecionam conforme a resposta.

**Acceptance Scenarios**:

1. **Given** credenciais validas, **When** envio `POST /api/auth/sign-in`, **Then** a sessao e criada e o cliente navega para `/`.
2. **Given** credenciais invalidas, **When** envio login, **Then** o cliente navega para `/login?error=invalid_credentials`.
3. **Given** codigo MFA valido, **When** envio verificacao ou cadastro, **Then** o cliente navega para `/`.
4. **Given** falha esperada de MFA, **When** envio JSON, **Then** a API retorna `redirectTo` com a rota de erro adequada.

## Requirements

### Functional Requirements

- **FR-001**: O projeto MUST deixar de importar Server Actions nas paginas.
- **FR-002**: Mutacoes de categorias MUST usar Route Handlers em `src/app/api/**/route.ts`.
- **FR-003**: Route Handlers MUST aceitar e responder `application/json`.
- **FR-004**: Controllers MUST validar requests, montar `ApplicationContext`, chamar services e mapear erros para status HTTP/body.
- **FR-005**: Services de dominio MUST continuar recebendo `ApplicationContext` e command especifico.
- **FR-006**: UI client-side MUST enviar JSON com `fetch` e atualizar a rota/tela apos sucesso.
- **FR-007**: Login e MFA MUST usar endpoints JSON em vez de Server Actions.
- **FR-008**: Mensagens exibidas ao usuario MUST continuar em portugues.

## Success Criteria

- **SC-001**: Testes relevantes passam com `pnpm test`.
- **SC-002**: `pnpm typecheck` passa.
- **SC-003**: `pnpm lint` passa.
- **SC-004**: `rg "use server|server/actions|auth/actions|mfa-actions" src` nao encontra actions usadas pela UI.
