# Architecture

## Visao Geral

Este projeto e uma aplicacao de financas pessoais construida com Next.js.

A stack atual usa o Next.js como base full-stack:

- frontend com React, App Router e componentes server/client conforme necessidade;
- backend com Server Actions, Route Handlers e codigo server-side;
- persistencia com Supabase/Postgres e Drizzle;
- validacao de entradas com Zod;
- TypeScript como linguagem principal.

A implementacao antiga em Java/Spring Boot foi movida para `old/` e esta descontinuada. Ela pode ser consultada apenas como referencia historica de dominio, nunca como padrao tecnico para novas alteracoes.

## Principios Arquiteturais

O projeto deve privilegiar separacao forte de responsabilidades.

Nao misturar no mesmo arquivo:

- componentes React;
- Server Actions;
- controllers ou handlers;
- services;
- repositories;
- DTOs;
- schemas de validacao;
- mappers;
- entidades de dominio;
- tipos compartilhados;
- regras de negocio.

Cada arquivo deve ter um papel claro. Quando uma mudanca exigir mais de uma responsabilidade, crie arquivos separados e conecte as camadas por contratos explicitos.

## Estrutura Recomendada

Esta e a estrutura alvo para novas implementacoes e refatoracoes graduais:

```text
src/
|-- app/
|   |-- (private)/
|   |-- (public)/
|   |-- api/
|   |-- layout.tsx
|   `-- page.tsx
|
|-- components/
|   |-- ui/
|   |-- layout/
|   `-- domain/
|
|-- modules/
|   |-- entries/
|   |-- wallets/
|   |-- categories/
|   |-- dashboard/
|   `-- reports/
|
|-- server/
|   |-- actions/
|   |-- controllers/
|   |-- requests/
|   |-- responses/
|   |-- context/
|   |-- commands/
|   |-- services/
|   |-- usecases/
|   |-- repositories/
|   |-- dto/
|   |-- schemas/
|   |-- mappers/
|   |-- unit-of-work/
|   |-- infrastructure/
|   `-- validators/
|
|-- domain/
|   |-- entities/
|   |-- enums/
|   |-- value-objects/
|   |-- rules/
|   `-- errors/
|
|-- db/
|   |-- client.ts
|   `-- schema.ts
|
|-- lib/
|-- hooks/
|-- storage/
|-- validation/
`-- types/
```

A estrutura real pode evoluir aos poucos. Ao tocar em codigo existente, preferir mover na direcao dessa organizacao sem fazer refatoracoes grandes e desconectadas da tarefa.

## Camada Frontend

### `src/app`

Responsavel por rotas, layouts, paginas, loading states e error boundaries.

Arquivos em `src/app` devem compor a tela e delegar comportamento. Evite colocar regra de negocio, acesso direto a banco ou validacao complexa dentro de paginas.

### `src/components`

Componentes reutilizaveis e sem dependencia forte de uma feature especifica.

Organizacao recomendada:

```text
components/
|-- ui/
|-- layout/
`-- domain/
```

- `ui/`: botoes, inputs, dialogs, cards, tabelas genericas e elementos visuais reutilizaveis.
- `layout/`: shell, header, sidebar, navegacao e estrutura global.
- `domain/`: componentes compartilhados que conhecem conceitos do dominio, como `MoneyDisplay`, `WalletBadge` e `EntryDirectionBadge`.

### `src/modules`

Agrupa UI e fluxos de uma area funcional sem misturar backend.

Exemplo:

```text
modules/entries/
|-- components/
|-- forms/
|-- tables/
|-- pages/
`-- view-models/
```

Use `modules/` para telas e fluxos com alta coesao, como lancamentos, carteiras, categorias, dashboard e relatorios.

## Camada Backend

### `src/server`

Codigo que deve executar apenas no servidor.

Organizacao recomendada:

```text
server/
|-- actions/
|-- controllers/
|-- requests/
|-- responses/
|-- context/
|-- commands/
|-- services/
|-- usecases/
|-- repositories/
|-- dto/
|-- schemas/
|-- mappers/
|-- unit-of-work/
|-- infrastructure/
`-- validators/
```

### `server/actions`

Server Actions usadas por formularios e interacoes do frontend.

Responsabilidades:

- receber dados de formulario ou comandos da UI;
- validar entradas de borda;
- chamar services;
- revalidar rotas quando necessario;
- retornar estado de erro/sucesso ou executar redirects.

Server Actions nao devem conter regra de negocio principal.

### `server/controllers`

Camada de entrada para Route Handlers e APIs internas quando a rota precisar de organizacao propria.

Responsabilidades:

- receber e validar objetos de request, como `CreateWalletRequest`;
- adaptar HTTP para chamadas de aplicacao;
- validar parametros de rota;
- montar o `ApplicationContext`;
- chamar mappers de request para command;
- chamar services;
- traduzir resultados e erros para response body e HTTP status;
- retornar objetos de response, como `CreateWalletResponse`.

Controllers nao devem conter regras de negocio nem acessar repositories diretamente.

### `server/context`

Contem o `ApplicationContext` e o `TransactionContext`.

O `ApplicationContext` representa a identidade e metadados da operacao atual.

Modelo esperado:

```ts
export type PrincipalType = "user" | "system";

export type ApplicationPrincipal = {
  type: PrincipalType;
  id: string;
};

export type ApplicationContext = {
  principal: ApplicationPrincipal;
  transaction?: TransactionContext;
  correlationId?: string;
  now: Date;
};
```

O principal pode ser:

- `user`: operacao disparada por usuario autenticado;
- `system`: operacao disparada pelo sistema, job, rotina interna ou importacao.

O contexto deve oferecer uma forma segura de derivar um novo contexto com transacao, por exemplo `withTransaction(transaction)`, preservando principal, correlacao e data da operacao.

### `server/commands`

Commands representam intencao de aplicacao.

Exemplo:

```ts
export type CreateWalletCommand = {
  name: string;
  type: WalletType;
  initialBalanceInCents?: number;
};
```

Commands sao recebidos por services. Eles nao sao requests HTTP, responses HTTP nem entidades de dominio.

### `server/services`

Services funcionam como facades de aplicacao e orquestradores.

Responsabilidades:

- receber exatamente dois parametros em operacoes de escrita: `ApplicationContext` e o command especifico;
- abrir e controlar transacoes via Unit of Work quando a operacao altera estado;
- coordenar use cases;
- chamar mappers entre command, dominio e resultado;
- orquestrar infraestruturas, como notificacoes, eventos, storage e integracoes;
- garantir que efeitos colaterais acontecam no ponto correto da transacao.

Assinatura padrao:

```ts
create(
  context: ApplicationContext,
  command: CreateWalletCommand,
): Promise<CreateWalletResult>
```

Services nao devem concentrar regras de negocio detalhadas. Essa responsabilidade pertence aos use cases e ao dominio.

### `server/usecases`

Use cases executam regras de negocio de um caso de uso.

Responsabilidades:

- receber parametros ja adaptados para o dominio ou um input proprio do use case;
- validar regras de negocio;
- aplicar defaults de dominio, como status inicial;
- verificar duplicidade;
- chamar repositories;
- retornar entidade, resultado de dominio ou DTO de aplicacao.

Exemplo:

```text
create-wallet.usecase.ts
```

O use case nao deve conhecer request/response HTTP, Server Actions ou detalhes visuais.

### `server/repositories`

Acesso direto a persistencia.

Responsabilidades:

- montar queries Drizzle;
- buscar registros;
- inserir, atualizar e remover dados;
- esconder detalhes do banco das camadas superiores.

Repositories nao devem conter regra de negocio complexa.

Repositories devem receber `ApplicationContext` quando precisarem participar de uma transacao. Eles devem usar a conexao transacional presente em `context.transaction` quando existir; caso contrario, podem usar o client padrao para leituras ou operacoes fora de transacao.

### `server/dto`

Estruturas de entrada e saida entre camadas de aplicacao.

DTOs nao sao entidades de dominio. Eles existem para transportar dados em casos de uso, APIs, formularios e respostas.

### `server/schemas`

Schemas de validacao, preferencialmente com Zod.

Schemas ficam separados de DTOs e services. Eles validam formato e restricoes de borda, mas nao substituem regras de negocio.

### `server/mappers`

Conversao entre formatos:

- banco para dominio;
- dominio para DTO;
- formulario para command;
- DTO para view model.

Mappers evitam espalhar transformacoes dentro de services, repositories e componentes.

## Unit of Work e Transacoes

Operacoes que alteram estado devem ser executadas dentro de uma transacao controlada pelo service.

O padrao recomendado segue o modelo de Unit of Work:

```ts
export interface UnitOfWork {
  execute<T>(
    context: ApplicationContext,
    work: (context: ApplicationContext) => Promise<T>,
  ): Promise<T>;
}
```

A implementacao concreta deve abrir uma transacao no banco e executar o callback com um novo `ApplicationContext` contendo `TransactionContext`.

Fluxo recomendado:

```text
Service
-> unitOfWork.execute(context, async (transactionContext) => ...)
-> Use Case
-> Repository
-> Database
```

Exemplo conceitual:

```ts
async create(
  context: ApplicationContext,
  command: CreateWalletCommand,
): Promise<CreateWalletResult> {
  return this.unitOfWork.execute(context, async (txContext) => {
    const walletDraft = createWalletCommandToDomain(command);
    const wallet = await this.createWalletUseCase.execute(txContext, {
      wallet: walletDraft,
    });

    await this.eventBus.publish(txContext, walletCreated(wallet));

    return walletToCreateWalletResult(wallet);
  });
}
```

O `TransactionContext` deve atravessar service, use case e repository pelo `ApplicationContext`. Evite adicionar um terceiro parametro apenas para transacao.

Quando houver efeitos colaterais externos, como notificacoes ou disparos de eventos para fora do processo, avaliar se devem ocorrer dentro da transacao, depois do commit ou por outbox. O padrao preferencial para eventos externos criticos e gravar uma outbox na mesma transacao e processar depois do commit.

## Camada de Dominio

### `src/domain`

Contem conceitos centrais e regras estaveis do sistema financeiro.

Organizacao recomendada:

```text
domain/
|-- entities/
|-- enums/
|-- value-objects/
|-- rules/
`-- errors/
```

Exemplos:

- `Entry`;
- `Wallet`;
- `Category`;
- `Money`;
- `EntryNature`;
- `WalletType`;
- `OperationalCashFlowRules`;
- `InvalidEntryError`.

Essa camada deve proteger as tres dimensoes principais do sistema:

1. Fluxo de caixa operacional.
2. Liquidez real.
3. Patrimonio liquido.

Esses conceitos nao devem ser misturados em queries, telas ou relatorios.

## Fluxo Entre Camadas

Fluxo recomendado para escrita:

```text
Page / Component
-> Server Action ou Controller
-> Request DTO
-> Request Mapper
-> ApplicationContext
-> Service
-> Command
-> Unit of Work
-> Use Case
-> Repository
-> Database
-> Response Mapper
-> Response DTO
```

Fluxo recomendado para leitura com regra de negocio:

```text
Page / Server Component
-> Query server-side ou Service
-> Repository
-> Database
```

Componentes React nao devem acessar banco diretamente.

## Banco de Dados

O schema Drizzle vive em `src/db/schema.ts`.

Migrations de Supabase vivem em `supabase/migrations`.

Regras:

- novas mudancas de schema devem ter migration;
- queries de aplicacao devem passar por repositories;
- valores monetarios devem ser armazenados como inteiros em centavos;
- conversao entre reais e centavos deve acontecer apenas nas bordas.

## Diretorio `old/`

O diretorio `old/` contem a implementacao anterior em Java/Spring Boot.

Regras:

- nao adicionar novas funcionalidades nele;
- nao usar como referencia de arquitetura tecnica;
- nao copiar padroes Java para a stack Next.js;
- consultar apenas quando for necessario recuperar intencao de dominio.
