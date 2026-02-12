Você está trabalhando no projeto **finance**, um sistema pessoal de controle financeiro
com as seguintes premissas já consolidadas:

## Contexto do domínio

- O sistema separa explicitamente:
    - **Fluxo de Caixa Operacional**
    - **Patrimônio / Títulos Negociáveis**
- Não existe previsão ou marcação a mercado.
- Todos os lançamentos representam **fatos ocorridos**.
- Valores são sempre armazenados em centavos (`INTEGER`).
- Categorias são **dinâmicas**, funcionam como tags analíticas e **não podem ser usadas
  como regra de negócio**.

## Modelo relevante

Tabela `entry`:
- `nature`: OPERATIONAL | PATRIMONIAL
- `direction`: IN | OUT
- `transfer_id`: nullable (quando faz parte de uma transferência/conversão)
- `wallet_id`

Tabela `wallet`:
- `type`: CASH | CREDIT_CARD | NEGOTIABLE_SECURITY | LONG_TERM | ASSET

## Problema atual

O **relatório de Fluxo de Caixa Mensal** está inflado porque:
- Resgates de investimentos (ex.: RDB, ações) estão sendo somados como "Recebimentos"
- Transferências internas também estão contaminando os agregados

Isso gera números semanticamente incorretos, embora tecnicamente válidos.

## Regra de negócio correta

O Fluxo de Caixa Mensal deve refletir **geração ou consumo real de riqueza**,
não mera conversão ou reorganização de ativos.

### Devem entrar como RECEBIMENTOS:
- Entradas que:
    - `entry.direction = 'IN'`
    - `entry.nature = 'OPERATIONAL'`
    - `entry.transfer_id IS NULL`
    - `wallet.type = 'CASH'`

Exemplos:
- Salário
- Rendimentos (dividendos, juros)
- Reembolsos

### Devem entrar como DESPESAS:
- Saídas que:
    - `entry.direction = 'OUT'`
    - `entry.nature = 'OPERATIONAL'`
    - `entry.transfer_id IS NULL`
    - `wallet.type = 'CASH'`

Exemplos:
- Consumo
- Pagamento de contas
- Gastos operacionais

### NÃO devem entrar em Recebimentos / Despesas:
- Transferências entre caixas
- Resgates de investimentos
- Aplicações em investimentos
- Conversões patrimoniais

Esses eventos devem continuar existindo no sistema, mas **fora da equação principal**
do fluxo de caixa.

## O que deve ser feito

1. Ajustar a **query / lógica** do relatório de Fluxo de Caixa Mensal para:
    - Calcular corretamente:
        - Recebimentos Totais
        - Despesas Totais
        - Fluxo de Caixa Líquido
    - Seguindo estritamente as regras acima
    - Sem usar `category` como critério

2. Garantir que:
    - O saldo final das carteiras continue correto
    - Transferências e resgates não desapareçam do sistema
    - Apenas deixem de contaminar o fluxo econômico

3. Se possível, sugerir:
    - Uma métrica auxiliar opcional como “Origem do Caixa” (ex.: quanto veio de resgates),
      mas **fora** do cálculo principal.

## Restrições técnicas

- Não alterar o schema do banco neste momento
- Não criar hardcodes por nome de categoria
- Preferir SQL claro e explícito
- Manter o modelo simples e previsível

Implemente o ajuste e explique brevemente a lógica aplicada.
