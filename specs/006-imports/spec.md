# Spec: Importacao de lancamentos

## Problema

O usuario precisa importar lancamentos exportados do Nubank sem gravar fatos financeiros definitivos antes de revisar os dados.

## Escopo

- Criar tela privada `/imports` para listar importacoes e iniciar novo upload.
- Aceitar CSV Nubank de cartao e NuConta.
- Persistir o pedido em `import_requests` e as linhas em `import_rows`.
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

## UI Esperada

- A tela segue o prototipo `docs/finance-prototipo.zip` adaptado ao design atual.
- A listagem mostra arquivo, origem, status, total, pendentes, ignoradas e confirmadas.
- O modal de nova importacao coleta arquivo, origem, carteira, categoria, natureza e evento economico default.
- A revisao exibe linhas editaveis com data, descricao, carteira, categoria, natureza, evento, valor e status.

## Criterios de Aceite

- Nenhum registro e inserido em `entries` no upload.
- Confirmar importacao cria lancamentos definitivos e marca o pedido como `CONFIRMED`.
- Erros de validacao retornam mensagens em portugues.
- A tela funciona com dados reais de carteiras, categorias e importacoes do usuario autenticado.
- Testes cobrem parsing do CSV e confirmacao sem inserir antes da confirmacao.
