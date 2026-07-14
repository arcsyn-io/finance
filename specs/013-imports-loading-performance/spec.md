# Spec: Carregamento eficiente da lista de importacoes

## Problema

A rota privada `/imports` carrega todo o historico de importacoes junto com todas as suas linhas antes de renderizar a lista. Em producao, o volume historico torna a consulta, a serializacao do Server Component e a hidratacao do componente cliente lentos.

## Escopo

- Carregar a listagem inicial usando apenas metadados e contagens agregadas por importacao.
- Carregar as linhas completas somente para a importacao aberta para revisao.
- Manter a listagem com arquivo, origem, status, total, pendentes e ignoradas.
- Manter a revisao, upload, edicao e confirmacao sem alteracao de regras de negocio.

## Regras

- A listagem nao deve transportar `ImportRow` de importacoes que nao estao abertas.
- As contagens exibidas na listagem devem ser equivalentes a: total de linhas, linhas sem lancamento nem ignoradas e linhas ignoradas.
- Um link direto para uma importacao continua carregando suas linhas para a revisao.

## Criterios de aceite

- A pagina `/imports` busca resumos agregados para a listagem inicial.
- A consulta de resumo nao executa uma consulta por importacao nem por linha.
- Abrir uma importacao carrega somente aquela importacao completa.
- Upload e edicoes atualizam as contagens apresentadas na listagem.
- Testes cobrem a transformacao de uma importacao completa para o resumo exibido.
