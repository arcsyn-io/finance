import type { EconomicEvent } from "@/domain/entry/entry";

export type FinancialHelpSection = {
  readonly id: "lancamentos" | "carteiras" | "categorias" | "natureza" | "eventos";
  readonly title: string;
  readonly description: string;
  readonly bullets: readonly string[];
};

export type EconomicEventHelp = {
  readonly id: EconomicEvent;
  readonly title: string;
  readonly description: string;
  readonly example: string;
};

export const financialHelpSections: readonly FinancialHelpSection[] = [
  {
    id: "lancamentos",
    title: "Lançamentos: o registro de cada fato",
    description:
      "Um lançamento registra o que aconteceu em uma data: uma entrada, uma saída, uma compra, uma aplicação ou outro fato financeiro.",
    bullets: [
      "Informe carteira, categoria, natureza, valor, data e uma descrição que facilite a conferência.",
      "O valor é registrado em reais na interface e preservado em centavos pelo sistema para manter os cálculos precisos.",
      "A descrição identifica o estabelecimento ou contexto; a categoria deve descrever a finalidade financeira.",
    ],
  },
  {
    id: "carteiras",
    title: "Carteiras: onde está o valor",
    description:
      "Uma carteira representa uma conta, uma obrigação ou uma posição patrimonial. Separe conta corrente, dinheiro, cartão de crédito, investimentos e bens para enxergar cada posição corretamente.",
    bullets: [
      "Carteiras de caixa representam dinheiro disponível e são as únicas consideradas no fluxo de caixa operacional.",
      "O cartão de crédito é uma carteira própria: a compra registra o consumo; o dinheiro sai da conta quando a fatura é liquidada.",
      "Títulos, posições de longo prazo e bens registram composição patrimonial, não dinheiro disponível para pagar despesas hoje.",
    ],
  },
  {
    id: "categorias",
    title: "Categorias e direção: por que o valor entrou ou saiu",
    description:
      "A categoria explica a finalidade do lançamento e define automaticamente sua direção. Uma categoria de receita gera entrada; uma categoria de despesa gera saída.",
    bullets: [
      "Não escolha entrada ou saída manualmente: a categoria mantém essa regra consistente nos relatórios.",
      "Prefira categorias de finalidade, como Supermercado, Moradia ou Remuneração, em vez do nome de cada estabelecimento.",
      "Use a descrição para registrar o mercado, a loja ou outra referência específica.",
    ],
  },
  {
    id: "natureza",
    title: "Natureza: operação, liquidez e patrimônio",
    description:
      "A natureza mostra como o fato deve ser interpretado. Ela ajuda a manter fluxo de caixa operacional, liquidez real e patrimônio líquido em visões separadas.",
    bullets: [
      "Operacional: recebimentos e pagamentos em carteiras de caixa que representam a rotina financeira, como salário e conta de energia.",
      "Patrimonial: consumo no cartão, aplicações, resgates e alterações na composição de ativos ou obrigações.",
      "No fluxo de caixa operacional entram somente lançamentos operacionais, em carteiras de caixa e sem vínculo de transferência. Movimentações patrimoniais continuam visíveis separadamente.",
    ],
  },
  {
    id: "eventos",
    title: "Evento econômico: o que aconteceu",
    description:
      "O evento econômico detalha o tipo do fato. Você pode selecioná-lo ao registrar o lançamento; quando ele não é informado, o sistema o infere conforme a carteira, a natureza e a direção.",
    bullets: [
      "Uma transferência movimenta o mesmo valor entre duas carteiras próprias, com um lançamento de saída e outro de entrada vinculados. Ela não é receita nem despesa.",
      "A compra no cartão normalmente é consumo patrimonial; o pagamento da fatura é a liquidação operacional da obrigação.",
      "Aplicar ou resgatar investimentos altera a composição patrimonial e não deve ser classificado como despesa operacional.",
    ],
  },
];

export const economicEventHelp: readonly EconomicEventHelp[] = [
  { id: "INCOME", title: "Renda", description: "Recebimento recorrente ou eventual, como remuneração ou bônus.", example: "Salário recebido na conta corrente." },
  { id: "CAPITAL_INCOME", title: "Renda de capital", description: "Ganho ou rendimento originado de capital investido.", example: "Juros recebidos de um título de renda fixa." },
  { id: "CONSUMPTION", title: "Consumo", description: "Aquisição ou uso de um produto ou serviço.", example: "Compra de supermercado realizada no cartão." },
  { id: "INVESTMENT", title: "Investimento", description: "Aplicação de recursos ou formação de uma posição patrimonial.", example: "Aplicação em um CDB ou outro título negociável." },
  { id: "DIVESTMENT", title: "Desinvestimento", description: "Resgate ou venda de uma posição patrimonial.", example: "Resgate de uma aplicação para retornar recursos à conta." },
  { id: "LIQUIDATION", title: "Liquidação", description: "Pagamento de uma obrigação, como uma conta ou fatura.", example: "Pagamento da fatura do cartão pela conta corrente." },
  { id: "TRANSFER", title: "Transferência", description: "Movimentação entre carteiras próprias, sem gerar receita ou despesa.", example: "Envio da conta corrente para a poupança." },
  { id: "ADJUSTMENT", title: "Ajuste", description: "Correção necessária para conciliar uma posição registrada.", example: "Correção de uma diferença encontrada no saldo da carteira." },
  { id: "LOSS", title: "Perda", description: "Redução de valor ou baixa patrimonial que precisa ser reconhecida.", example: "Registro da perda de valor de um bem ou investimento." },
  { id: "INITIAL_BALANCE", title: "Saldo inicial", description: "Valor de partida usado para representar a posição inicial de uma carteira.", example: "Saldo existente na conta no primeiro dia de uso do sistema." },
];
