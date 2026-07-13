# Feature Specification: Análise anual de fluxo de caixa

## Problema

O usuário precisa avaliar se a operação cotidiana gera caixa suficiente ao longo do ano, sem confundir renda e despesas operacionais com transferências, investimentos ou outras movimentações patrimoniais. A aplicação atual possui apenas uma composição estática para essa visão, embora os lançamentos e as configurações mensais já estejam persistidos.

## Escopo

- disponibilizar a rota privada `/analysis/cash-flow` e vinculá-la ao item `Fluxo de caixa mensal` do grupo `Análises`;
- apresentar janeiro a dezembro do ano selecionado, usando o ano atual como padrão e permitindo navegar para o ano anterior ou seguinte;
- calcular recebimentos e despesas operacionais exclusivamente a partir de lançamentos não excluídos, em carteiras `CASH`, com natureza `OPERATIONAL` e sem transferência;
- calcular mensalmente fluxo líquido, saldo final e excedente ou resgate necessário;
- carregar e persistir saldo inicial e caixa mínimo por mês, em centavos, sem criar lançamentos;
- permitir aplicar a mesma configuração do mês selecionado até dezembro do mesmo ano;
- apresentar três gráficos mensais e uma matriz anual com os indicadores;
- agrupar recebimentos e despesas por categoria, com expansão das linhas;
- apresentar separadamente as movimentações de carteiras `CASH` que sejam patrimoniais ou façam parte de transferência;
- permitir abrir os lançamentos que compõem uma célula não vazia e editar categoria, carteira e descrição;
- exibir valores monetários em reais somente na interface.

## Regras de negócio

1. Recebimentos operacionais incluem somente lançamentos com `direction = IN`, `nature = OPERATIONAL`, `transfer_id IS NULL`, carteira `CASH` e `deleted_at IS NULL`.
2. Despesas operacionais aplicam os mesmos filtros, com `direction = OUT`.
3. Categorias são agrupadores analíticos e não participam da decisão de elegibilidade do fluxo.
4. Transferências, aplicações, resgates e demais fatos patrimoniais permanecem visíveis apenas na seção auxiliar de movimentações não operacionais.
5. Fluxo líquido = recebimentos − despesas.
6. Saldo final = saldo inicial + fluxo líquido.
7. Excedente ou resgate = saldo final − caixa mínimo; valor negativo indica necessidade de resgate.
8. Configuração mensal inexistente equivale a saldo inicial e caixa mínimo iguais a zero.
9. Saldo inicial e caixa mínimo são configurações gerenciais e nunca devem gerar ou alterar lançamentos.
10. Aplicar aos meses seguintes replica os dois valores do mês selecionado até dezembro, inclusive, dentro de uma única transação.
11. Todos os cálculos monetários usam inteiros em centavos.

## Experiência e estados da interface

- o cabeçalho identifica a visão como uma análise anual do caixa operacional;
- a navegação anual mantém o ano na URL;
- os gráficos mostram `Receitas x despesas`, `Fluxo líquido` e `Excedente / resgate`;
- a matriz possui primeira coluna fixa, rolagem horizontal e doze colunas mensais;
- recebimentos e despesas começam recolhidos e podem revelar categorias ordenadas pelo total anual decrescente;
- células de detalhe com valor zero mostram `-` e não são interativas;
- valores positivos e negativos possuem distinção visual, sem depender somente da cor nos rótulos de resultado;
- a seção auxiliar separa entradas, saídas, seus totais e o resultado não operacional;
- sem lançamentos, a estrutura anual continua visível com valores zerados;
- o detalhamento informa carregamento, vazio, erro, total e permite fechar por botão, fundo ou tecla Escape;
- o editor de configuração valida os valores, informa erro ou sucesso e atualiza a análise após salvar;
- a página deve ser utilizável em telas pequenas, com gráficos empilhados e tabela rolável.

## Fora de escopo

- projeções futuras, fluxo diário e automatização de resgates;
- carregar automaticamente o saldo final de um mês como saldo inicial do mês seguinte;
- alterar o schema do banco;
- usar nomes de categorias como regra de negócio;
- exportação do relatório.

## Critérios de aceite

1. O item de navegação abre `/analysis/cash-flow` e o ano atual é exibido por padrão.
2. A visão sempre contém os doze meses do ano selecionado.
3. Somente lançamentos elegíveis compõem recebimentos, despesas e fluxo líquido.
4. Transferências e lançamentos patrimoniais não alteram os indicadores operacionais e aparecem na seção auxiliar quando pertencem a uma carteira `CASH`.
5. As três fórmulas mensais são calculadas corretamente em centavos.
6. Os agrupamentos por categoria conciliam com os totais mensais, incluindo uma linha `Sem categoria` quando necessário.
7. Saldo inicial e caixa mínimo podem ser salvos para um mês e, opcionalmente, replicados até dezembro.
8. O drill-down de totais e categorias lista somente os lançamentos da célula escolhida.
9. A edição de categoria, carteira ou descrição remove ou reposiciona o lançamento na análise após a atualização.
10. Estados de zero, carregamento, vazio, erro e sucesso são apresentados em português.
11. Testes automatizados comprovam consolidação anual, fórmulas e propagação da configuração; lint e typecheck permanecem verdes.
