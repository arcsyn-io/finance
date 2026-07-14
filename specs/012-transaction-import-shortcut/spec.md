# Feature Specification: Atalho de importacao em Transacoes

## Problema

Para importar um arquivo, o usuario precisa sair da tela de Transacoes e navegar ate a area de Importacoes.

## Escopo

- exibir um botao "Importar" no cabecalho de `/transactions`;
- abrir o mesmo modal de upload usado pela area de Importacoes;
- enviar o arquivo para o endpoint existente de importacoes;
- apos o upload, abrir a revisao da importacao criada em `/imports`.

## Fora de escopo

- duplicar parsing, validacao, persistencia ou confirmacao de importacoes;
- alterar contratos da API de importacoes.

## Criterios de aceite

1. O botao Importar aparece na tela de Transacoes.
2. Clicar no botao abre o modal de nova importacao com arquivo, origem e defaults.
3. O envio usa `POST /api/imports` e mantém o modal aberto quando houver erro.
4. Um upload bem-sucedido navega para a revisao da importacao criada.
5. O fluxo continua usando os mesmos dados de carteiras e categorias do usuario.
