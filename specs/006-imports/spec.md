# Spec: Importacao de lancamentos

## Problema

O usuario precisa importar lancamentos exportados do Nubank sem gravar fatos financeiros definitivos antes de revisar os dados.

## Escopo

- Criar tela privada `/imports` para listar importacoes e iniciar novo upload.
- Aceitar CSV Nubank de cartao e NuConta.
- Persistir o pedido em `import_requests` e as linhas em `import_rows`.
- Persistir anexos em `import_attachments`, permitindo anexo global da importacao ou anexo por linha.
- Permitir revisao das linhas em tabela antes da confirmacao.
- Confirmar importacao criando lancamentos em `entries` apenas no final do fluxo.

## Regras de Negocio

- O CSV e input nao confiavel e deve ser validado antes de persistir linhas.
- Arquivos aceitos: `.csv`, UTF-8, ate 5 MB.
- Nubank cartao usa colunas `date,title,amount`; valor positivo vira `OUT`, negativo vira `IN`.
- NuConta usa colunas `Data,Valor,Identificador,Descricao`; valor positivo vira `IN`, negativo vira `OUT`.
- Valores monetarios devem ser convertidos para centavos inteiros, com valor absoluto.
- Importacoes confirmadas nao podem ser editadas, canceladas ou confirmadas novamente.
- A confirmacao exige carteira, categoria e natureza em cada linha ou nos defaults do pedido.
- Linhas ignoradas nao geram lancamentos.
- Duplicatas com `external_id` na mesma carteira devem ser ignoradas na confirmacao.
- Uma importacao pode ter anexos globais, usados para representar a fatura/documento de origem.
- Uma linha da importacao pode ter anexos proprios, usados quando cada item possui comprovante individual.
- Um anexo por linha deve pertencer obrigatoriamente a uma linha da mesma importacao.
- Anexos de importacao devem ser privados e visiveis apenas para o usuario dono da importacao.

## UI Esperada

- A tela segue o prototipo `docs/finance-prototipo.zip` adaptado ao design atual.
- A listagem mostra arquivo, origem, status, total, pendentes, ignoradas e confirmadas.
- O modal de nova importacao coleta arquivo, origem, carteira, categoria, natureza e evento economico default.
- A revisao exibe linhas editaveis com data, descricao, carteira, categoria, natureza, evento, valor e status.
- A revisao permite anexar documentos na importacao inteira e em cada linha.
- A revisao indica quando uma importacao ou linha possui anexos.
- A revisao permite alternar a visualizacao das linhas entre ordem por data e agrupamento por status.
- Na visualizacao por status, as linhas sao agrupadas em Pendente, Concluido e Ignorada, com contagem por grupo.
- Ao selecionar linhas, a revisao exibe acoes em lote para editar, concluir, ignorar e remover as linhas selecionadas.
- A edicao em lote exibe uma linha de campos editaveis no formato `Nome do campo: valor selecionado`.

## Criterios de Aceite

- Nenhum registro e inserido em `entries` no upload.
- Confirmar importacao cria lancamentos definitivos e marca o pedido como `CONFIRMED`.
- Erros de validacao retornam mensagens em portugues.
- A tela funciona com dados reais de carteiras, categorias e importacoes do usuario autenticado.
- O usuario consegue anexar uma fatura global e tambem anexos individuais em linhas da mesma importacao.
- Testes cobrem parsing do CSV e confirmacao sem inserir antes da confirmacao.
