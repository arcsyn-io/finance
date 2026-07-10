# Workflow

## Comandos Principais

Usar `pnpm` como gerenciador do projeto.

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

No Windows, os comandos sao os mesmos no PowerShell.

## Desenvolvimento Local

Para iniciar a aplicacao:

```bash
pnpm dev
```

Antes de finalizar uma alteracao, rodar pelo menos:

```bash
pnpm lint
pnpm typecheck
```

Quando houver testes configurados para a area alterada, rodar tambem os testes relevantes.

## Fluxo com GitHub Spec Kit

Para funcionalidades, mudancas de comportamento ou alteracoes relevantes de arquitetura, usar GitHub Spec Kit antes da implementacao.

Fluxo esperado:

1. Criar ou atualizar a spec.
2. Registrar criterios de aceite.
3. Identificar regras de dominio afetadas.
4. Definir os testes que comprovam o comportamento.
5. Implementar seguindo TDD.

A spec deve guiar a implementacao. Se o codigo divergir da spec, atualize a spec ou corrija o codigo.

## TDD Red -> Green -> Refactor

O fluxo padrao de implementacao e:

```text
Spec
-> Teste falhando
-> Implementacao minima
-> Teste passando
-> Refatoracao
-> Validacao final
```

### Red

Escreva o teste antes da implementacao.

O teste deve falhar pelo motivo esperado. Se ele falhar por setup, erro de ambiente ou expectativa errada, corrija o teste antes de implementar.

### Green

Implemente o menor codigo suficiente para passar o teste.

Preserve a separacao de camadas:

- UI em componentes/modulos;
- entrada em actions/controllers;
- regra em services/domain;
- persistencia em repositories;
- validacao em schemas/validators;
- transformacao em mappers.

### Refactor

Com os testes verdes, melhore nomes, extraia duplicacoes reais e ajuste organizacao sem mudar comportamento.

Nao aproveitar essa etapa para incluir comportamento novo.

## Migrations

Quando alterar schema:

1. Atualizar `src/db/schema.ts`.
2. Criar novas migrations com `npx supabase migration new nome_descritivo`.
3. Revisar o SQL gerado.
4. Adicionar ou ajustar migrations em `supabase/migrations`.
5. Rodar a migration localmente quando o ambiente permitir.
6. Atualizar repositories, DTOs, schemas e testes.

## Checklist Antes de Finalizar

- A spec foi criada ou atualizada quando necessario.
- Houve teste falhando antes da implementacao quando aplicavel.
- Os testes relevantes passam.
- `pnpm lint` passa.
- `pnpm typecheck` passa.
- As camadas continuam separadas.
- DTOs, schemas, services, repositories e componentes nao foram misturados.
- Migrations foram criadas quando houve mudanca de banco.
- O diretorio `old/` nao foi usado como base tecnica.
- A documentacao foi atualizada quando necessario.

## Quando Nao Usar TDD Completo

TDD completo pode ser simplificado para mudancas puramente documentais, ajustes mecanicos sem comportamento ou pequenas correcoes de texto.

Mesmo nesses casos, rode as validacoes cabiveis se houver impacto em codigo.
