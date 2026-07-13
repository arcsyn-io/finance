# Plano: Importacao de lancamentos

1. Implementar dominio/tipos de importacao e parser CSV isolado.
2. Criar repository, service, use cases, schemas, mappers e controllers de importacao.
3. Preparar cada linha com sugestoes historicas de categoria, natureza e evento economico antes de persisti-la, mantendo o parser independente de banco e regras de aplicacao.
4. Expor rotas API para listar, criar, editar linha, ignorar/restaurar, confirmar e cancelar.
5. Criar pagina privada `/imports` e componente cliente de revisao inspirado no prototipo.
6. Adicionar anexos de importacao com tabela `import_attachments`, storage privado e rotas para anexo global e por linha.
7. Adicionar link no shell e validar com testes, lint e typecheck.
8. Na confirmacao, reutilizar os objetos dos anexos da importacao e criar os respectivos vinculos em `entry_attachments` para cada lancamento criado.
