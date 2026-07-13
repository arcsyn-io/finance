# Feature Specification: Consumo por categoria

## Problema

O usuario precisa analisar onde ocorreu consumo patrimonial por competencia, sem misturar pagamentos, transferencias, liquidez ou fluxo de caixa operacional.

## Escopo

- adicionar `Consumo por categoria` ao grupo `Analises` da navegacao;
- disponibilizar a rota privada `/analysis/consumption`;
- filtrar por intervalo de datas, usando o mes atual como padrao;
- considerar somente lancamentos nao excluidos com evento economico `CONSUMPTION` e categoria;
- exibir total do periodo, participacao percentual e matriz mensal por categoria.
- abrir o detalhamento de uma categoria com os lancamentos que compoem seu total;
- permitir alterar categoria, natureza e evento economico no detalhamento.

## Fora de escopo

- metas, planejamento, previsoes e comparacoes historicas;
- alterar schema ou dados persistidos.

## Criterios de aceite

1. O item `Consumo por categoria` aparece em `Analises` e abre a rota da analise.
2. O intervalo inicial cobre o mes corrente e pode ser alterado pelo usuario.
3. Somente lancamentos nao excluidos com `economic_event = CONSUMPTION` e categoria compoem os valores, independentemente de natureza, direcao ou carteira.
4. O total geral e igual a soma das categorias e dos meses.
5. Cada categoria mostra total, percentual do total e valores mensais em centavos, formatados em reais somente na UI.
6. A pagina apresenta estado vazio quando nao houver consumo no periodo.
7. Ao selecionar uma categoria, uma modal lista exatamente os lancamentos com evento economico `CONSUMPTION` que compoem seu total no periodo.
8. Na modal, o usuario pode salvar alteracoes de categoria, natureza e evento economico; a analise e atualizada depois da edicao.
9. O periodo usa `occurred_on >= inicio` e `occurred_on < fim exclusivo`; a data final inclusiva escolhida na UI e convertida para o inicio do dia seguinte.
10. Os valores sao somados em centavos, agrupados por categoria e apresentados do maior para o menor total consumido.

## Testes

- service consolida linhas mensais, total e percentual sem arredondar valores monetarios;
- service preserva meses sem consumo na matriz do intervalo;
- repository aplica exclusao logica, evento `CONSUMPTION` e intervalo semiaberto;
- modal usa o mesmo evento economico e remove da lista uma edicao que deixe de atender ao criterio;
- validacoes de lint, tipos e suite automatizada permanecem verdes.
