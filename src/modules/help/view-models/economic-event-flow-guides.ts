export type EconomicEventFlowGuide = {
  readonly id: "classificacao" | "cartao" | "transferencia" | "investimento";
  readonly title: string;
  readonly scenario: string;
  readonly steps: readonly {
    readonly label: string;
    readonly detail: string;
  }[];
  readonly conclusion: string;
};

export const economicEventFlowGuides: readonly EconomicEventFlowGuide[] = [
  {
    id: "classificacao",
    title: "Como classificar um lançamento",
    scenario: "Exemplo: pagamento de uma conta de energia pela conta corrente.",
    steps: [
      { label: "Carteira", detail: "Conta corrente" },
      { label: "Categoria", detail: "Energia elétrica (despesa)" },
      { label: "Natureza", detail: "Operacional" },
      { label: "Evento", detail: "Liquidação" },
    ],
    conclusion:
      "Como é uma saída operacional em carteira de caixa, ela compõe a despesa do fluxo de caixa operacional.",
  },
  {
    id: "cartao",
    title: "Compra no cartão de crédito",
    scenario: "Exemplo: compra de R$ 300,00 em supermercado no cartão.",
    steps: [
      { label: "Carteira", detail: "Cartão de crédito" },
      { label: "Categoria", detail: "Supermercado (despesa)" },
      { label: "Natureza", detail: "Patrimonial" },
      { label: "Evento", detail: "Consumo" },
    ],
    conclusion:
      "O consumo é reconhecido na compra, mas o caixa só é afetado quando a fatura é paga pela conta corrente com o evento Liquidação.",
  },
  {
    id: "transferencia",
    title: "Transferência entre carteiras",
    scenario: "Exemplo: transferir R$ 1.000,00 da conta corrente para a poupança.",
    steps: [
      { label: "Origem", detail: "Conta corrente: saída" },
      { label: "Vínculo", detail: "Transferência" },
      { label: "Destino", detail: "Poupança: entrada" },
      { label: "Evento", detail: "Transferência" },
    ],
    conclusion:
      "Os dois lançamentos têm o mesmo valor e ficam vinculados. A transferência não gera receita, despesa nem altera o fluxo operacional.",
  },
  {
    id: "investimento",
    title: "Aplicação em investimento",
    scenario: "Exemplo: aplicar R$ 2.000,00 da conta corrente em um título de renda fixa.",
    steps: [
      { label: "Origem", detail: "Conta corrente" },
      { label: "Destino", detail: "Título negociável" },
      { label: "Natureza", detail: "Patrimonial" },
      { label: "Evento", detail: "Investimento" },
    ],
    conclusion:
      "A aplicação muda a composição do patrimônio. Ela permanece separada do fluxo de caixa operacional, assim como o resgate (Desinvestimento).",
  },
];
