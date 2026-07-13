# Feature Specification: Feedback de carregamento da interface

## Problema

Em rotas privadas dinâmicas e consultas sob demanda, a interface pode permanecer visualmente estática enquanto dados são carregados. Isso dificulta distinguir uma operação em andamento de uma interação sem efeito, especialmente nas análises financeiras.

## Escopo

- exibir skeletons proporcionais ao conteúdo nas rotas privadas, incluindo painel, análises, transações, importações, carteiras e categorias;
- manter o skeleton imediatamente perceptível nas navegações iniciadas pelo menu lateral;
- indicar carregamento nas trocas de ano do fluxo de caixa e de período do consumo por categoria, impedindo comandos duplicados;
- substituir áreas vazias de carregamento nos detalhamentos de análises por skeletons de tabela;
- tornar o andamento de autenticação e encerramento de sessão explícito, com controles desabilitados enquanto a solicitação estiver pendente;
- preservar os dados existentes até que a nova rota esteja disponível, sem sobrepor a tela inteira durante mutações pontuais.

## Fora de escopo

- alterar regras de negócio, APIs, schema, persistência ou contratos de domínio;
- adicionar atrasos artificiais, barras globais de progresso ou bibliotecas de animação;
- modificar os fluxos já cobertos por feedback específico em transações, importações, carteiras e categorias.

## Critérios de aceite

1. Cada rota privada possui fallback de carregamento com estrutura coerente com sua tela e texto acessível em português.
2. O menu lateral apresenta o fallback adequado também para painel e análises durante a navegação.
3. Durante mudança de ano ou período, os controles mostram que a consulta está sendo atualizada e não aceitam nova interação até a conclusão.
4. Detalhamentos de fluxo de caixa e consumo mostram linhas de skeleton enquanto os lançamentos são buscados.
5. Login, MFA e saída comunicam processamento e evitam novo envio durante a solicitação.
6. Skeletons usam os tokens visuais existentes, animação discreta e `aria-busy`/rótulos que não dependem apenas de cor.

## Testes e validação

- validar via typecheck e lint que os novos componentes e fallbacks podem ser compostos em páginas server e client;
- revisar visualmente navegação, controles de análise, modais de detalhamento e autenticação em desktop e mobile;
- executar a suite automatizada existente para garantir que não houve regressão de domínio.
