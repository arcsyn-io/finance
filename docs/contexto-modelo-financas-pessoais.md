# Contexto Geral — Modelo de Finanças Pessoais (para IA / Claude)

## Objetivo deste documento

Este documento serve para alinhar o entendimento conceitual de uma IA
(Claude, ChatGPT, etc.) sobre o modelo de finanças pessoais deste sistema.

Ele não é uma task técnica, mas um guia mental para:
- compreender decisões de modelagem
- respeitar invariantes de domínio
- evitar misturas conceituais comuns (fluxo ≠ patrimônio ≠ liquidez)

Sempre que for implementar algo novo, este documento deve ser considerado
fonte de verdade conceitual.

---

## Visão Geral do Sistema

O sistema separa claramente três dimensões:

1. Fluxo de Caixa Operacional
2. Liquidez Real (Circulante)
3. Patrimônio (Longo Prazo)

Essas dimensões não se misturam e existem para responder perguntas diferentes.

---

## 1. Fluxo de Caixa Operacional

### O que é

Fluxo de caixa representa a saúde financeira do dia a dia.

Ele responde à pergunta:
Minha renda operacional sustenta meu custo de vida neste período?

### O que entra

Somente lançamentos que sejam:
- operacionais
- recorrentes ou previsíveis
- ligados à manutenção da vida

Entradas típicas:
- salário
- pró-labore
- retirada de lucro
- bônus / PLR

Saídas típicas:
- alimentação
- moradia
- transporte
- saúde
- educação
- lazer
- contas recorrentes

### O que NÃO entra (mesmo passando pelo caixa)

- compra ou venda de investimentos
- dividendos
- rendimentos de CDI
- compra de imóveis
- amortização extraordinária
- qualquer realocação patrimonial

### Regras estruturais

- considera apenas:
  - carteiras do tipo CASH
  - lançamentos com nature = OPERATIONAL
- o saldo inicial do período é informado manualmente
- o fluxo nunca se corrige por patrimônio

---

## 2. Liquidez Real (Circulante)

### O que é

Liquidez real representa capacidade imediata de pagamento.

Ela responde à pergunta:
Quanto dinheiro eu consigo mobilizar agora, se precisar?

### O que entra

- saldo de carteiras CASH
- saldo de carteiras NEGOTIABLE_SECURITY
  - ações
  - FIIs
  - CDI
  - bitcoin
  - dividendos recebidos
  - rendimentos financeiros

### O que NÃO entra

- bens
- imóveis
- investimentos ilíquidos
- previdência
- ativos de longo prazo

### Regras estruturais

- liquidez é um snapshot, não um fluxo
- não depende de período
- não distingue operacional vs patrimonial

---

## 3. Patrimônio

### O que é

Patrimônio representa visão de longo prazo.

Ele responde à pergunta:
Qual é minha posição financeira total ao longo do tempo?

### Composição

- circulante (liquidez)
- imobilizado
  - imóveis
  - bens
  - investimentos de longo prazo

### Regras estruturais

- patrimônio não interfere no fluxo de caixa
- crescimento patrimonial não mascara déficit operacional

---

## Conceitos Fundamentais

### Lançamento (Entry)

- representa um fato financeiro
- é imutável (dados não são alterados após criação, apenas correções)
- suporta soft delete via `deleted_at` para correção de erros de input
- não carrega lógica de visão
- pode aparecer em várias visões ou em nenhuma

---

### Carteira (Wallet)

- representa onde o dinheiro ou ativo está
- define elegibilidade de visão, não comportamento

Tipos:
- CASH
- NEGOTIABLE_SECURITY
- LONG_TERM
- ASSET

---

### Categoria (Category)

- representa o significado semântico do lançamento
- exemplos: Alimentação, Moradia, Salário
- possui type = INCOME ou EXPENSE
- não define fluxo, liquidez ou patrimônio

---

### Natureza do Lançamento (EntryNature)

Define impacto sistêmico:
- OPERATIONAL
- PATRIMONIAL

Natureza é sempre explícita e nunca inferida automaticamente.

---

## Regras de Ouro (não violar)

1. Fluxo de caixa não é dinheiro em conta
2. Investimento não é despesa operacional
3. Dividendo não é renda operacional
4. Patrimônio não corrige fluxo
5. Lançamentos são fatos, visões filtram fatos
6. Nenhuma visão altera o significado de um lançamento

---

## Modelo Mental Esperado da IA

Antes de implementar qualquer coisa, a IA deve se perguntar:
- Isso é fluxo, liquidez ou patrimônio?
- Estou misturando conceitos?
- Estou inferindo algo que deveria ser explícito?
- Essa decisão mascara um problema estrutural?

Se gerar ambiguidade, a implementação está errada.

---

## Encerramento

Este sistema não é um app de extrato bancário.
Ele é uma ferramenta de decisão financeira pessoal, com:
- consciência de liquidez
- separação entre operação e patrimônio
- foco em sustentabilidade no tempo

Qualquer automação que quebre essa clareza deve ser evitada.
