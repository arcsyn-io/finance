# Plano: Importacao de lancamentos

1. Implementar dominio/tipos de importacao e parser CSV isolado.
2. Criar repository, service, use cases, schemas, mappers e controllers de importacao.
3. Expor rotas API para listar, criar, editar linha, ignorar/restaurar, confirmar e cancelar.
4. Criar pagina privada `/imports` e componente cliente de revisao inspirado no prototipo.
5. Adicionar anexos de importacao com tabela `import_attachments`, storage privado e rotas para anexo global e por linha.
6. Adicionar link no shell e validar com testes, lint e typecheck.
7. Na confirmacao, reutilizar os objetos dos anexos da importacao e criar os respectivos vinculos em `entry_attachments` para cada lancamento criado.
