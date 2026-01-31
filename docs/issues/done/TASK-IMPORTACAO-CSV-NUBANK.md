# Tarefa: Importação de Lançamentos via CSV (Nubank)

## Contexto

O sistema **finance** precisa permitir a importação de lançamentos financeiros a partir
de arquivos CSV exportados do Nubank, facilitando o cadastro em massa e a posterior
categorização dos lançamentos.

A importação deve ser feita de forma **segura, explícita e reversível**, permitindo
edição prévia dos dados antes da inserção definitiva na tabela de lançamentos.

---

## Objetivo

Permitir que o usuário:

1. Faça upload de um arquivo CSV do Nubank
2. Defina valores default aplicáveis aos lançamentos importados
3. Visualize e edite os dados em formato de planilha
4. Confirme a importação apenas ao final do fluxo

---

## Ponto de Entrada (UI)

### Dropdown "Novo lançamento"

Ao clicar em **Novo lançamento**, exibir as opções:

- Inserir lançamento manual
- Importar arquivo

Ao selecionar **Importar arquivo**, o sistema deve redirecionar para:

```
GET /lancamentos/importacao
```

---

## Fluxo de Importação

### Etapa 1 — Upload e Configuração Inicial

**Tela:** Importação de Lançamentos

#### Inputs obrigatórios

- Arquivo CSV (formato Nubank)
- Carteira (default)
- Natureza da operação (entrada | saída)
- Data de ocorrência (default, caso não exista no arquivo)
- Categoria (default)

#### Regras

- Aceitar apenas arquivos `.csv`
- Tamanho máximo configurável (ex: 5MB)
- Encoding esperado: UTF-8
- Separador padrão: `,`

#### Validações iniciais

- Cabeçalho compatível com o formato Nubank
- Campos obrigatórios presentes
- Datas em formato válido
- Valores numéricos parseáveis

#### Persistência

Ao validar com sucesso:

- Registrar um **pedido de importação**
- Não inserir lançamentos ainda
- Armazenar os registros em tabela intermediária

Exemplo de status do pedido:

- `PENDING_REVIEW`
- `INVALID`
- `CONFIRMED`

---

### Etapa 2 — Revisão e Edição (Prévia)

**Tela:** Revisão da Importação

Exibir os registros em formato de **planilha editável**, contendo:

- Descrição
- Data de ocorrência
- Valor
- Categoria
- Carteira
- Natureza da operação

#### Comportamento

- Cada célula deve ser editável
- Alterações são salvas na tabela intermediária
- Nenhum lançamento é inserido na tabela principal nesta etapa
- Possibilidade de excluir linhas individualmente da importação

#### Regras

- Revalidar campos editados
- Indicar visualmente campos inválidos
- Bloquear avanço se houver erros de validação

---

### Etapa 3 — Confirmação

Ao clicar em **Confirmar importação**:

- Validar novamente todos os registros
- Inserir lançamentos na tabela definitiva de lançamentos
- Atualizar status do pedido para `CONFIRMED`
- Registrar data/hora da confirmação

Após sucesso:

- Redirecionar para listagem de lançamentos
- Exibir feedback visual de sucesso

---

## Modelo de Dados (Sugestão)

### Tabela: import_requests

- id
- status
- source (ex: NUBANK_CSV)
- created_at
- confirmed_at
- wallet_id
- operation_type
- default_category_id

### Tabela: import_rows

- id
- import_request_id
- description
- occurred_at
- amount
- category_id
- wallet_id
- operation_type
- valid (boolean)
- validation_errors (text/json)

---

## Requisitos Técnicos

- Spring MVC + Thymeleaf
- Upload multipart
- HTMX para edição inline na etapa 2
- jOOQ para persistência
- SQLite
- Flyway para versionamento
- Sem processamento assíncrono inicialmente

---

## Fora de Escopo

- Suporte a outros bancos
- Importação automática recorrente
- Detecção inteligente de categorias
- Undo pós-confirmação

---

## Critérios de Aceitação

- Nenhum lançamento é inserido sem confirmação explícita
- Erros de validação são claros para o usuário
- Fluxo é linear e previsível
- Código simples, sem abstrações desnecessárias
- SQL explícito para leitura e escrita

---

## Observações

- O CSV do Nubank deve ser tratado como **input não confiável**
- Todo dado deve passar por validação explícita
- A importação é um **processo**, não um atalho de cadastro
