# Spec 007 - Anexos em transacoes

## Problema

O usuario precisa anexar comprovantes e documentos a uma transacao financeira. Uma transacao pode ter varios arquivos, e os binarios devem ficar no Supabase Storage, enquanto o banco guarda apenas metadados e referencias aos objetos.

## Escopo

- Criar relacionamento 1:N entre `entries` e anexos.
- Fazer upload pelo server-side, repassando o arquivo ao Supabase Storage.
- Listar anexos de uma transacao autenticada.
- Exibir icone de anexo nas actions da listagem de transacoes.
- Destacar o icone quando a transacao possui anexos.
- Abrir modal com input de upload no mesmo padrao visual da importacao.
- Exibir cards com preview dos arquivos existentes quando houver.

## Fora de Escopo

- OCR ou leitura automatica de comprovantes.
- Associar anexos a importacoes.
- Exclusao fisica de anexos.
- Alterar a semantica financeira de transacoes.

## Regras

- O banco armazena metadados: usuario, transacao, bucket, object path, nome original, MIME type, tamanho e datas.
- O storage usa caminho com `userId/entries/{entryId}/...` para manter isolamento por usuario.
- A API nunca aceita gravar anexo em transacao de outro usuario.
- O registro do anexo deve ser criado em transacao de banco apos upload bem sucedido.
- A listagem de transacoes deve retornar `attachmentCount` para a UI destacar o icone sem carregar todos os anexos.
- Previews devem usar URL assinada temporaria.

## Criterios de Aceite

- Dado um arquivo valido, quando o usuario envia pelo modal, entao o arquivo e enviado ao Supabase Storage pelo servidor e o anexo aparece na lista da modal.
- Dada uma transacao com anexos, quando ela aparece na listagem, entao o icone de anexo fica visivel em destaque.
- Dada uma transacao sem anexos, quando ela aparece na listagem, entao o icone aparece apenas como action discreta.
- Dado um usuario autenticado, quando tenta listar anexos de transacao inexistente ou de outro usuario, entao recebe erro de nao encontrado.

## Testes

- Service cria anexo usando storage server-side, valida existencia da transacao e persiste metadados.
- Service lista anexos com URL assinada.
- Controller valida entrada FormData e retorna anexo criado.
- Controller retorna 404 quando a transacao nao existe.
