# Contribution

## Regra Geral

Toda contribuicao deve preservar a separacao entre dominio, aplicacao, persistencia e UI.

Antes de implementar, entenda:

- qual comportamento esta sendo alterado;
- qual camada deve receber a mudanca;
- quais testes devem falhar primeiro;
- se a mudanca exige atualizar specs ou documentacao.

## Spec Primeiro

Mudancas de comportamento devem comecar por uma spec usando GitHub Spec Kit.

Use a spec para definir:

- problema;
- escopo;
- comportamento esperado;
- regras de negocio;
- criterios de aceite;
- impactos em dados, UI, seguranca e testes.

Nao iniciar implementacao relevante direto pelo codigo quando o comportamento ainda nao esta especificado.

## TDD

O fluxo padrao e TDD:

1. Criar ou atualizar a spec com GitHub Spec Kit.
2. Escrever ou ajustar o teste primeiro.
3. Rodar os testes e confirmar o Red.
4. Implementar o minimo necessario.
5. Rodar os testes e confirmar o Green.
6. Refatorar mantendo os testes verdes.
7. Atualizar documentacao quando arquitetura, dominio ou workflow mudarem.

## Escopo

Mantenha a mudanca focada.

Evite misturar:

- feature nova com refatoracao ampla;
- ajuste visual com mudanca de persistencia;
- migracao estrutural com regra de negocio nova;
- limpeza de codigo com alteracao comportamental.

Quando uma refatoracao for necessaria para implementar a tarefa, limite a refatoracao ao caminho tocado pela mudanca.

## Criacao de Arquivos

Ao criar uma nova capacidade, separar os papeis em arquivos dedicados.

Exemplo para `entries`:

```text
src/server/context/application-context.ts
src/server/unit-of-work/unit-of-work.ts
src/server/requests/create-entry-request.ts
src/server/responses/create-entry-response.ts
src/server/commands/create-entry-command.ts
src/server/dto/entry-dto.ts
src/server/schemas/entry-schema.ts
src/server/repositories/entry-repository.ts
src/server/services/entry-service.ts
src/server/usecases/create-entry.usecase.ts
src/server/actions/entry-actions.ts
src/server/mappers/entry-mapper.ts
src/modules/entries/components/EntryForm.tsx
```

Nao criar um arquivo unico contendo DTO, schema, service, query e componente.

## Services, Use Cases e Transacoes

Ao implementar uma operacao de escrita:

1. Crie request/response para a borda quando houver HTTP.
2. Crie command especifico para o service.
3. Monte `ApplicationContext` na borda.
4. Faca o service receber apenas `ApplicationContext` e command.
5. Abra transacao no service com Unit of Work quando houver mudanca de estado.
6. Passe o contexto transacional para o use case.
7. Faca o use case aplicar regras de negocio e chamar repositories.
8. Faca repositories usarem a transacao presente no contexto.

Nao passar transacao como terceiro parametro do service. A transacao pertence ao `ApplicationContext`.

## Testes

Priorize testes onde ha regra de negocio.

Cobertura minima esperada:

- services com regras financeiras;
- services que abrem Unit of Work e orquestram eventos/infraestruturas;
- use cases com regras de negocio;
- mappers com transformacoes relevantes;
- validators e schemas com casos invalidos;
- repositories quando a query tiver comportamento nao trivial;
- Server Actions quando houver tratamento de erro, redirect ou revalidation importante.

Testes devem deixar claro o comportamento esperado, nao apenas exercitar implementacao.

## Banco de Dados

Alteracoes de schema exigem migration correspondente.

Ao alterar banco:

- atualizar `src/db/schema.ts`;
- criar migration em `supabase/migrations`;
- revisar RLS/policies quando afetar dados do usuario;
- ajustar repositories e testes;
- documentar impacto quando relevante.

## UI

UI deve ser consistente com a aplicacao existente.

Regras:

- usar componentes compartilhados quando existirem;
- manter telas responsivas;
- preferir Server Components;
- usar Client Components apenas quando necessario;
- nao colocar regra de negocio em componentes;
- manter textos exibidos ao usuario em portugues.

## Revisao

Antes de finalizar uma mudanca:

- confirme que a spec esta atualizada;
- confirme que houve Red antes do Green quando aplicavel;
- rode lint, typecheck e testes relevantes;
- revise se as camadas continuam separadas;
- verifique se o `old/` nao foi alterado sem necessidade;
- atualize documentacao quando a mudanca mudar padroes do projeto.

## Diretorio `old/`

Nao contribuir com novas funcionalidades no `old/`.

Esse diretorio existe apenas para referencia historica da versao Java/Spring Boot.
