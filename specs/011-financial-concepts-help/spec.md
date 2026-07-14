# Feature Specification: Página de ajuda sobre conceitos financeiros

## Problema

Os campos de um lançamento financeiro representam conceitos diferentes e a classificação incorreta pode confundir consumo, liquidez, patrimônio e fluxo de caixa operacional. O sistema não possui uma referência contextual que explique esses conceitos a partir de suas regras reais.

## Escopo

- disponibilizar uma página privada em `/help`, acessível abaixo de Configurações no menu lateral;
- explicar carteira, categoria, direção, natureza, evento econômico, data, valor e descrição;
- orientar o registro de consumo no cartão, transferências, investimentos e pagamentos operacionais;
- diferenciar fluxo de caixa operacional, liquidez real e patrimônio líquido;
- alinhar os textos às regras atuais: categoria define direção, transferências são dois lançamentos vinculados e o fluxo de caixa operacional considera apenas lançamentos operacionais em carteiras de caixa sem transferência.
- apresentar diagramas de fluxo para classificação, cartão de crédito, transferências e investimentos;
- complementar cada evento econômico com um exemplo prático de uso.

## Fora de escopo

- alterar regras de domínio, APIs, persistência, relatórios ou formulários;
- criar fluxos de suporte, tutoriais interativos ou edição de lançamentos a partir da ajuda.

## Critérios de aceite

1. Usuários autenticados podem abrir `/help` pelo item "Ajuda" da navegação.
2. A página explica em português que uma categoria de receita gera entrada e uma categoria de despesa gera saída, sem permitir a escolha manual da direção.
3. A página separa explicitamente fluxo de caixa operacional, liquidez real e patrimônio líquido.
4. Os exemplos de cartão de crédito, transferência e investimento não os apresentam como despesa operacional por padrão.
5. O conteúdo descreve todos os eventos econômicos disponíveis no sistema em linguagem acessível.
6. A interface é responsiva, acessível e usa os componentes/tokens visuais existentes.
7. Os diagramas deixam explícito quando uma movimentação integra ou não o fluxo de caixa operacional.
8. Cada evento econômico disponível possui um exemplo prático relacionado a um lançamento.

## Testes e validação

- teste unitário assegura que o conteúdo cubra os conceitos e eventos econômicos previstos;
- executar `pnpm lint`, `pnpm typecheck` e `pnpm test`.
