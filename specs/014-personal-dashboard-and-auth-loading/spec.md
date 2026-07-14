# Feature Specification: Painel patrimonial e carregamento de autenticação

## Problema

O painel inicial apresenta valores e gráficos fixos que reproduzem uma visão de fluxo de caixa já disponível na análise anual. Além de não refletir os dados da pessoa usuária, isso mistura uma visão operacional com informações de liquidez e patrimônio. Nos formulários de login e MFA, o indicador de processamento pode desaparecer antes da conclusão da requisição assíncrona.

## Escopo

- manter um estado de envio ativo do início ao fim das requisições de login e MFA;
- desabilitar controles que alteram ou enviam dados enquanto a requisição estiver em andamento;
- substituir o painel estático por uma visão baseada nos lançamentos e carteiras ativos da pessoa usuária;
- exibir liquidez real, patrimônio líquido, investimentos financeiros, saldo devedor em cartão, composição patrimonial, carteiras com atenção e últimos lançamentos;
- preservar o fluxo de caixa operacional exclusivamente na rota de análise correspondente.

## Regras de domínio

- Liquidez real é a soma dos saldos atuais das carteiras ativas do tipo `CASH`.
- Patrimônio líquido é a soma dos saldos atuais de todas as carteiras ativas; portanto, saldos de cartão de crédito reduzem o total.
- Investimentos financeiros somam apenas as carteiras `NEGOTIABLE_SECURITY` e `LONG_TERM`.
- Dívida de cartão representa somente a parcela negativa do saldo agregado de carteiras `CREDIT_CARD`.
- O saldo atual de uma carteira é seu saldo inicial somado aos lançamentos não excluídos, respeitando a direção de cada lançamento.
- O painel não apresenta recebimentos, despesas, fluxo acumulado, saldo projetado nem outra métrica operacional já resolvida pela análise de fluxo de caixa.

## Critérios de aceite

1. Durante login, cadastro de MFA e validação de código MFA, o botão mostra processamento e todos os controles do formulário permanecem indisponíveis até a requisição terminar.
2. O painel não possui valores fictícios ou conjuntos de dados fixos.
3. O painel mostra, separadamente e com textos claros, liquidez real, patrimônio líquido, investimentos financeiros e dívida atual em cartão.
4. A composição patrimonial usa os tipos de carteira existentes e não classifica dívida como investimento ou liquidez.
5. O painel lista as carteiras ativas, sinaliza saldos negativos que não sejam de cartão e mostra os lançamentos mais recentes.
6. Sem dados, o painel mantém uma visualização íntegra e informa os valores zerados, sem inventar projeções.

## Testes e validação

- Cobrir o serviço do painel com carteiras de caixa, cartão, investimentos e bens, incluindo saldo negativo.
- Cobrir o retorno sem carteiras e sem lançamentos.
- Executar testes, lint, typecheck e build.
- Revisar o login, MFA e painel em viewport desktop e mobile.
