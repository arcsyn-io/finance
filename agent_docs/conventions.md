# Conventions

## Linguagem e Stack

- Usar TypeScript em todo codigo novo.
- Preferir tipagem explicita em bordas publicas: DTOs, retornos de services, repositories e actions.
- Usar React com Next.js App Router.
- Usar Drizzle para acesso ao banco.
- Usar Zod para validacao de entrada.
- Usar Supabase para autenticacao, storage e infraestrutura de dados quando aplicavel.

## Separacao de Arquivos

O projeto valoriza codigo bem separado por responsabilidade.

Nao criar arquivos que misturam:

- DTOs com services;
- schemas com repositories;
- componentes React com queries de banco;
- Server Actions com regras de negocio;
- mappers com validadores;
- entidades de dominio com detalhes de persistencia.

Prefira arquivos pequenos, coesos e nomeados pelo papel que exercem.

## Nomeacao

Use nomes descritivos e consistentes:

- `entry-service.ts`
- `entry-repository.ts`
- `entry-actions.ts`
- `entry-controller.ts`
- `create-entry.command.ts`
- `create-entry.usecase.ts`
- `entry-dto.ts`
- `entry-schema.ts`
- `entry-mapper.ts`
- `entry-validator.ts`

Para componentes React, usar PascalCase:

- `EntryForm.tsx`
- `MoneyDisplay.tsx`
- `WalletBadge.tsx`

Para tipos e interfaces, usar nomes que expressem o contrato:

- `CreateEntryInput`
- `CreateEntryDto`
- `CreateEntryRequest`
- `CreateEntryResponse`
- `CreateEntryCommand`
- `EntryViewModel`
- `EntryRepository`
- `EntryService`

## DTOs, Schemas e Tipos

DTOs transportam dados entre camadas. Eles nao devem conter regra de negocio.

Schemas validam entradas de borda. Eles nao devem chamar banco, services ou APIs externas.

Tipos de dominio representam conceitos do negocio e devem ficar fora de DTOs e schemas.

Quando houver conversao entre formatos, criar mapper dedicado.

## Services

Services sao facades de aplicacao e orquestradores de casos de uso e infraestruturas.

Um service pode:

- abrir transacoes via Unit of Work;
- coordenar use cases;
- coordenar outros services;
- chamar mappers;
- disparar eventos de aplicacao;
- coordenar notificacoes, storage e integracoes;
- retornar resultados de aplicacao.

Operacoes de escrita em services devem receber apenas dois parametros:

```ts
execute(
  context: ApplicationContext,
  command: SpecificCommand,
): Promise<Result>
```

Exemplo:

```ts
create(
  context: ApplicationContext,
  command: CreateWalletCommand,
): Promise<CreateWalletResult>
```

Um service nao deve:

- renderizar UI;
- depender de componentes React;
- montar respostas HTTP diretamente;
- conter detalhes visuais;
- receber request HTTP diretamente;
- receber varios parametros soltos;
- concentrar regra de negocio que pertence a use case ou dominio;
- conter queries longas inline se elas pertencem a repositories.

## Use Cases

Use cases executam regras de negocio.

Um use case pode:

- validar regras de dominio;
- aplicar defaults de dominio;
- verificar duplicidades;
- chamar repositories;
- decidir quando uma operacao e invalida;
- retornar entidade ou resultado de dominio.

Um use case nao deve:

- conhecer HTTP;
- conhecer React;
- montar response body;
- receber request DTO;
- disparar efeitos externos nao transacionais sem coordenacao do service.

Use cases devem receber `ApplicationContext` e um input proprio do caso de uso ou parametros de dominio claramente agrupados.

## ApplicationContext

Toda operacao de aplicacao deve carregar um `ApplicationContext`.

O contexto deve conter:

- `principal`, com tipo `user` ou `system`;
- `principal.id`;
- `transaction`, quando a operacao estiver dentro de transacao;
- metadados opcionais, como `correlationId` e `now`.

Controllers, Route Handlers e Server Actions montam o contexto. Services, use cases e repositories recebem o contexto.

Nao passar usuario, tenant, data atual ou transacao como parametros soltos quando esses dados pertencem ao contexto.

## Unit of Work

Operacoes que alteram estado devem ser transacionais quando envolverem mais de uma escrita, verificacao de unicidade, evento persistido, outbox ou qualquer invariavel de consistencia.

O service e responsavel por abrir a transacao usando Unit of Work:

```ts
unitOfWork.execute(context, async (transactionContext) => {
  return useCase.execute(transactionContext, input);
});
```

O `TransactionContext` deve ser carregado dentro do `ApplicationContext` derivado pelo Unit of Work.

Repositories devem escolher o client transacional quando `context.transaction` existir. Evite APIs de repository que recebem `tx` como parametro separado.

## Repositories

Repositories sao responsaveis por persistencia.

Um repository pode:

- usar Drizzle;
- montar queries;
- persistir e buscar registros;
- mapear tipos simples vindos do banco quando necessario.
- usar a transacao presente no `ApplicationContext` quando existir.

Um repository nao deve:

- conter regra de negocio;
- decidir fluxo de tela;
- validar formulario;
- conhecer componentes React.

## Controllers, Requests e Responses

Controllers e Route Handlers lidam com a borda HTTP.

Eles devem:

- receber `CreateEntityRequest`;
- validar dados de entrada;
- montar `ApplicationContext`;
- mapear request para command;
- chamar service;
- mapear resultado para `CreateEntityResponse`;
- definir HTTP status.

Eles nao devem chamar repositories nem conter regra de negocio.

## Server Actions

Server Actions sao bordas de interacao entre UI e backend.

Elas devem:

- receber dados da UI;
- validar formato de entrada;
- chamar services;
- tratar erros esperados;
- revalidar rotas ou redirecionar quando necessario.

Elas nao devem substituir services.

## Componentes React

Componentes devem ser focados em apresentacao e interacao.

Regras:

- Server Components por padrao.
- Client Components apenas quando houver estado local, efeitos, eventos de browser ou bibliotecas que exigem cliente.
- Evitar acesso direto a banco em componentes.
- Evitar regra de negocio em componentes.
- Componentes compartilhados devem ser genericos o bastante para ficarem em `components/`.
- Componentes especificos de uma area devem ficar em `modules/{module}/`.

## Dominio Financeiro

O sistema separa tres dimensoes que nao devem ser misturadas:

1. Fluxo de caixa operacional.
2. Liquidez real.
3. Patrimonio liquido.

Regras de ouro:

1. Fluxo de caixa nao e saldo de conta.
2. Investimento nao e despesa operacional.
3. Dividendo nao e renda operacional.
4. Patrimonio nao corrige deficit operacional.
5. Lancamentos sao fatos; visoes filtram fatos.

## Valores Monetarios

- Armazenar dinheiro como inteiro em centavos.
- Nao usar `float` ou `number` decimal para calculos monetarios persistidos.
- Converter reais para centavos apenas nas bordas.
- Converter centavos para formato exibivel apenas na UI ou em formatadores dedicados.

## Erros

Erros de negocio devem ser explicitos e nomeados pelo dominio.

Exemplos:

- `EntryNotFoundError`
- `InvalidEntryError`
- `DuplicateCategoryNameError`

Mensagens exibidas ao usuario devem ser em portugues.

## Estilo de Codigo

- Preferir funcoes pequenas e coesas.
- Preferir retornos explicitos em funcoes de camada.
- Evitar abstracoes prematuras.
- Evitar arquivos barril quando eles esconderem dependencias importantes ou criarem ciclos.
- Nao fazer refatoracoes amplas sem relacao com a tarefa.
- Manter imports e dependencias entre camadas previsiveis.
