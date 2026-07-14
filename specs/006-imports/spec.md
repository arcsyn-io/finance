# Spec: Importacao de lancamentos

## Problema

O usuario precisa importar lancamentos exportados do Nubank sem gravar fatos financeiros definitivos antes de revisar os dados.

## Escopo

- Criar tela privada `/imports` para listar importacoes e iniciar novo upload.
- Aceitar CSV Nubank de cartao e NuConta.
- Persistir o pedido em `import_requests` e as linhas em `import_rows`.
- Persistir anexos em `import_attachments`, permitindo anexo global da importacao ou anexo por linha.
- Permitir revisao das linhas em tabela antes da confirmacao.
- Confirmar importacao criando lancamentos em `entries` apenas no final do fluxo.

## Regras de Negocio

- O CSV e input nao confiavel e deve ser validado antes de persistir linhas.
- Arquivos aceitos: `.csv`, UTF-8, ate 5 MB.
- Nubank cartao usa colunas `date,title,amount`; valor positivo vira `OUT`, negativo vira `IN`.
- NuConta usa colunas `Data,Valor,Identificador,Descricao`; valor positivo vira `IN`, negativo vira `OUT`.
- Valores monetarios devem ser convertidos para centavos inteiros, com valor absoluto.
- Depois do parsing e antes de persistir as linhas, a importacao deve sugerir categoria, natureza e evento economico a partir do historico de lancamentos confirmados do proprio usuario.
- O historico de sugestoes deve considerar no maximo os 1.000 lancamentos mais recentes, nao excluidos, sem transferencia e com a mesma direcao da linha. Quando houver carteira padrao, o historico deve ser restrito a essa carteira; sem carteira padrao, deve considerar todas as carteiras do usuario.
- A descricao usada na comparacao deve ser normalizada removendo acentos, diferencas entre maiusculas e minusculas, pontuacao e espacos repetidos. No matching por tokens, devem ser ignorados tokens de ate dois caracteres e as palavras `compra`, `debito`, `credito`, `cartao`, `nubank`, `pagamento`, `recebido`, `nu`, `pay`, `nupay`, `de`, `do`, `da`, `no`, `na` e `em`.
- O score de similaridade deve ser 100 para descricao normalizada identica, 85 quando uma descricao normalizada contem a outra e, nos demais casos, o percentual arredondado da intersecao de tokens sobre o menor conjunto, multiplicado por 80. Scores menores que 55 devem ser descartados.
- Os matches devem ser agrupados pela tupla categoria, natureza e evento economico. Vence a maior soma de scores; em empate, a maior quantidade de ocorrencias; persistindo o empate, a tupla da ocorrencia historica mais recente.
- A sugestao deve preencher cada campo da linha somente quando o respectivo default nao tiver sido informado no pedido. A precedencia efetiva deve ser: valor editado na linha, default do pedido e sugestao historica.
- Sem match elegivel, os campos sem default devem permanecer vazios para revisao manual. Alterar a descricao durante a revisao nao deve recalcular a sugestao.
- Categorias inativas presentes no historico continuam elegiveis, preservando o comportamento anterior. Registros sem categoria valida nao participam da sugestao.
- Importacoes confirmadas nao podem ser editadas, canceladas ou confirmadas novamente.
- O usuario pode selecionar uma ou mais importacoes na listagem e removê-las em lote, inclusive quando estiverem confirmadas.
- Remover uma importacao apaga apenas o pedido, suas linhas e os vinculos de anexos da importacao. Lancamentos ja criados na confirmacao, incluindo seus vinculos de anexos, permanecem intactos.
- A confirmacao exige carteira, categoria e natureza em cada linha ou nos defaults do pedido.
- Linhas ignoradas nao geram lancamentos.
- Duplicatas com `external_id` na mesma carteira devem ser ignoradas na confirmacao.
- Uma importacao pode ter anexos globais, usados para representar a fatura/documento de origem.
- Uma linha da importacao pode ter anexos proprios, usados quando cada item possui comprovante individual.
- Um anexo por linha deve pertencer obrigatoriamente a uma linha da mesma importacao.
- Anexos de importacao devem ser privados e visiveis apenas para o usuario dono da importacao.
- Ao confirmar a importacao, cada anexo global deve ser vinculado a todos os lancamentos criados, por meio de registros em `entry_attachments` que apontam para o mesmo objeto no storage.
- Ao confirmar a importacao, cada anexo de linha deve ser vinculado somente ao lancamento criado a partir daquela linha.
- A confirmacao nao deve duplicar o arquivo no storage; os vinculos de lancamento reutilizam bucket, caminho e metadados do anexo da importacao.
- O mesmo objeto do storage pode ser vinculado a lancamentos distintos, mas nao pode ser vinculado mais de uma vez ao mesmo lancamento.
- Linhas ignoradas ou descartadas como duplicadas nao criam lancamento nem vinculo de anexo.

## UI Esperada

- A tela segue o prototipo `docs/finance-prototipo.zip` adaptado ao design atual.
- A listagem mostra arquivo, origem, status, total, pendentes, ignoradas e confirmadas.
- O modal de nova importacao coleta arquivo, origem, carteira, categoria, natureza e evento economico default.
- Durante o envio do arquivo, o modal informa que a importacao esta sendo preparada e bloqueia fechamento, reenvio e edicao dos campos.
- A revisao exibe linhas editaveis com data, descricao, carteira, categoria, natureza, evento, valor e status.
- A revisao exibe os valores sugeridos como valores especificos da linha e permite que o usuario os substitua antes da confirmacao.
- A revisao permite anexar documentos na importacao inteira e em cada linha.
- A revisao indica quando uma importacao ou linha possui anexos.
- A revisao permite alternar a visualizacao das linhas entre ordem por data e agrupamento por status.
- Na visualizacao por status, as linhas sao agrupadas em Pendente, Concluido e Ignorada, com contagem por grupo.
- Ao selecionar linhas, a revisao exibe acoes em lote para editar, concluir, ignorar e remover as linhas selecionadas.
- A edicao em lote exibe uma linha de campos editaveis no formato `Nome do campo: valor selecionado`.
- A edicao em lote envia uma unica requisicao com todos os ids selecionados e o patch comum, sem disparar uma requisicao por linha.
- Cada importacao da listagem possui um checkbox. Ao haver selecao, a tela exibe a acao para remover as importacoes selecionadas.

## Criterios de Aceite

- Nenhum registro e inserido em `entries` no upload.
- O upload persiste em `import_rows` a categoria, a natureza e o evento sugeridos quando seus respectivos defaults nao foram informados.
- Descricoes equivalentes apesar de acentos, caixa, pontuacao ou termos ignorados recebem a mesma sugestao historica quando atingem o score minimo.
- Defaults informados pelo usuario nao sao sobrescritos por sugestoes, e importacoes sem match permanecem pendentes para preenchimento manual.
- Quando mais de uma tupla historica for elegivel, soma, quantidade e recencia determinam o resultado nesta ordem.
- Confirmar importacao cria lancamentos definitivos e marca o pedido como `CONFIRMED`.
- Confirmar importacao vincula a cada lancamento seus anexos de linha e todos os anexos globais da importacao.
- Falhas nas operacoes de importacao exibem um toaster de erro com mensagem apropriada.
- Operacoes concluidas exibem um toaster de sucesso.
- Apos uma confirmacao que cria lancamentos, o usuario e redirecionado para `/transactions`, filtrado entre a menor e a maior data dos lancamentos criados, e visualiza o toaster de sucesso na tela de destino.
- Durante a confirmacao, o botao deve permanecer desabilitado e exibir indicador de carregamento ate ocorrer erro, conclusao sem redirecionamento ou navegacao para Transacoes.
- Durante o envio de uma nova importacao, o modal exibe um indicador de carregamento e permanece bloqueado ate a requisicao terminar.
- Erros de validacao retornam mensagens em portugues.
- A tela funciona com dados reais de carteiras, categorias e importacoes do usuario autenticado.
- O usuario consegue anexar uma fatura global e tambem anexos individuais em linhas da mesma importacao.
- O usuario consegue remover em lote importacoes pendentes e confirmadas sem remover os lancamentos financeiros ja criados.
- Uma edicao em lote atualiza atomicamente todas as linhas selecionadas que pertencem a importacao aberta.
- Testes cobrem parsing do CSV, matching historico, precedencia de defaults e confirmacao sem inserir antes da confirmacao.
