# Plano: Análise anual de fluxo de caixa

1. Definir contratos de command e DTO para relatório anual e configuração mensal.
2. Criar repository Drizzle dedicado às agregações e à configuração, sempre isolado por usuário.
3. Criar use case transacional para persistir uma configuração ou replicá-la até dezembro.
4. Criar service de leitura e escrita que consolide os doze meses e aplique as fórmulas financeiras.
5. Expor controller e Route Handler para salvar a configuração mensal com validação Zod.
6. Criar a página server-side e componentes client-side para navegação, gráficos, matriz, drill-down e edição.
7. Atualizar a navegação e a revalidação da análise após alterações de lançamentos.
8. Validar o comportamento com TDD, lint, typecheck, testes automatizados e inspeção visual responsiva.
