# Tasks: Importacao de lancamentos

- [x] Parser CSV Nubank/Conta com testes.
- [x] Repository e service de importacao.
- [x] Controllers e rotas API.
- [x] Tela `/imports`.
- [x] Validacao final.
- [x] Vincular anexos globais e por linha aos lancamentos durante a confirmacao.
- [x] Exibir toasters e redirecionar confirmacao para o periodo importado.
- [x] Especificar e testar a regra pura de matching historico, incluindo normalizacao, score, agregacao e desempate.
- [x] Testar em `ImportService.create` o preenchimento por sugestao, a precedencia dos defaults e o fallback sem match.
- [x] Implementar consulta de historico isolada por usuario, direcao e carteira opcional.
- [x] Implementar o use case de sugestao e persistir os campos previstos em `import_rows`.
- [x] Validar a mudanca com testes, lint e typecheck.
- [x] Enviar a edicao em massa da revisao em uma unica requisicao e atualiza-la atomicamente.
