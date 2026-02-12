package com.lucaskalb.finance.config;

import com.lucaskalb.finance.dto.CreateCategoryCommand;
import com.lucaskalb.finance.dto.CreateEntryCommand;
import com.lucaskalb.finance.dto.CreateTransferCommand;
import com.lucaskalb.finance.dto.CreateWalletCommand;
import com.lucaskalb.finance.dto.UpdateCashFlowConfigCommand;
import com.lucaskalb.finance.model.Category;
import com.lucaskalb.finance.model.CategoryType;
import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.model.Wallet;
import com.lucaskalb.finance.model.WalletType;
import com.lucaskalb.finance.service.AccountService;
import com.lucaskalb.finance.service.CashFlowService;
import com.lucaskalb.finance.service.CategoryService;
import com.lucaskalb.finance.service.EntryService;
import com.lucaskalb.finance.service.TransferService;
import com.lucaskalb.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DevDataInitializer implements CommandLineRunner {

    private final AccountService accountService;
    private final WalletService walletService;
    private final CategoryService categoryService;
    private final EntryService entryService;
    private final TransferService transferService;
    private final CashFlowService cashFlowService;

    private final Map<String, Wallet> wallets = new HashMap<>();
    private final Map<String, Category> categories = new HashMap<>();
    private final Random random = new Random(42); // seed fixo para reprodutibilidade

    @Override
    public void run(String... args) {
        if (!isDatabaseEmpty()) {
            log.info("Banco de dados já contém dados. Pulando inicialização de dev.");
            return;
        }

        log.info("Iniciando carga de dados de desenvolvimento...");

        createAdminUser();
        createCategories();
        createWallets();
        createEntries();
        createTransfers();
        createCashFlowConfig();

        log.info("Carga de dados de desenvolvimento concluída com sucesso!");
        log.info("Usuário admin criado - username: admin, senha: 12345678");
    }

    private boolean isDatabaseEmpty() {
        return walletService.listAll().isEmpty();
    }

    private void createAdminUser() {
        log.info("Criando usuário admin...");
        accountService.createAccount("admin", "12345678");
    }

    private void createCategories() {
        log.info("Criando categorias...");

        // Categorias de Receita (INCOME)
        createCategory("Salário", CategoryType.INCOME);
        createCategory("Freelance", CategoryType.INCOME);
        createCategory("Investimentos", CategoryType.INCOME);
        createCategory("Dividendos", CategoryType.INCOME);
        createCategory("Rendimentos", CategoryType.INCOME);
        createCategory("Bônus", CategoryType.INCOME);
        createCategory("Presente", CategoryType.INCOME);
        createCategory("Reembolso", CategoryType.INCOME);
        createCategory("Transferência Entrada", CategoryType.INCOME);

        // Categorias de Despesa (EXPENSE)
        createCategory("Alimentação", CategoryType.EXPENSE);
        createCategory("Moradia", CategoryType.EXPENSE);
        createCategory("Transporte", CategoryType.EXPENSE);
        createCategory("Saúde", CategoryType.EXPENSE);
        createCategory("Educação", CategoryType.EXPENSE);
        createCategory("Lazer", CategoryType.EXPENSE);
        createCategory("Vestuário", CategoryType.EXPENSE);
        createCategory("Utilidades", CategoryType.EXPENSE);
        createCategory("Assinaturas", CategoryType.EXPENSE);
        createCategory("Seguros", CategoryType.EXPENSE);
        createCategory("Impostos", CategoryType.EXPENSE);
        createCategory("Outros", CategoryType.EXPENSE);
        createCategory("Transferência Saída", CategoryType.EXPENSE);
        createCategory("Aporte Investimento", CategoryType.EXPENSE);

        log.info("Categorias criadas: {}", categories.size());
    }

    private void createCategory(String name, CategoryType type) {
        var category = categoryService.create(new CreateCategoryCommand(name, type));
        categories.put(name, category);
    }

    private void createWallets() {
        log.info("Criando carteiras...");

        // Carteiras CASH (caixa)
        createWallet("Conta Corrente Itaú", WalletType.CASH);
        createWallet("Conta Corrente Nubank", WalletType.CASH);
        createWallet("Dinheiro em Espécie", WalletType.CASH);

        // Carteiras CREDIT_CARD
        createWallet("Cartão Nubank", WalletType.CREDIT_CARD);
        createWallet("Cartão Itaú", WalletType.CREDIT_CARD);

        // Carteiras NEGOTIABLE_SECURITY (investimentos líquidos)
        createWallet("CDB Nubank", WalletType.NEGOTIABLE_SECURITY);
        createWallet("Tesouro Selic", WalletType.NEGOTIABLE_SECURITY);
        createWallet("Ações", WalletType.NEGOTIABLE_SECURITY);
        createWallet("FIIs", WalletType.NEGOTIABLE_SECURITY);

        // Carteiras LONG_TERM (investimentos ilíquidos)
        createWallet("Previdência Privada", WalletType.LONG_TERM);

        // Carteiras ASSET (bens patrimoniais)
        createWallet("Apartamento", WalletType.ASSET);
        createWallet("Carro", WalletType.ASSET);

        log.info("Carteiras criadas: {}", wallets.size());
    }

    private void createWallet(String name, WalletType type) {
        var wallet = walletService.create(new CreateWalletCommand(name, type));
        wallets.put(name, wallet);
    }

    private void createEntries() {
        log.info("Criando lançamentos...");

        int currentYear = YearMonth.now().getYear();

        // Criar lançamentos para todos os meses do ano corrente (janeiro a dezembro)
        for (int month = 1; month <= 12; month++) {
            createEntriesForMonth(YearMonth.of(currentYear, month));
        }

        log.info("Lançamentos criados com sucesso!");
    }

    private void createEntriesForMonth(YearMonth month) {
        // === RECEITAS OPERACIONAIS ===

        // Salário (dia 5 de cada mês)
        createEntry(
                "Conta Corrente Itaú", "Salário", EntryNature.OPERATIONAL,
                1250000L, // R$ 12.500,00
                month.atDay(5).atTime(10, 0),
                "Salário mensal"
        );

        // Freelance ocasional (alguns meses)
        if (month.getMonthValue() % 3 == 0) {
            createEntry(
                    "Conta Corrente Nubank", "Freelance", EntryNature.OPERATIONAL,
                    randomAmount(150000, 350000), // R$ 1.500 - R$ 3.500
                    month.atDay(15).atTime(14, 30),
                    "Projeto freelance"
            );
        }

        // === DESPESAS OPERACIONAIS ===

        // Moradia (aluguel/condomínio)
        createEntry(
                "Conta Corrente Itaú", "Moradia", EntryNature.OPERATIONAL,
                350000L, // R$ 3.500,00
                month.atDay(10).atTime(9, 0),
                "Aluguel apartamento"
        );

        // Alimentação (várias no mês)
        for (int i = 0; i < 8; i++) {
            int day = Math.min(1 + (i * 3) + random.nextInt(3), month.lengthOfMonth());
            createEntry(
                    "Conta Corrente Nubank", "Alimentação", EntryNature.OPERATIONAL,
                    randomAmount(8000, 25000), // R$ 80 - R$ 250
                    month.atDay(day).atTime(12 + random.nextInt(8), random.nextInt(60)),
                    randomDescription("Supermercado", "Restaurante", "iFood", "Padaria", "Feira")
            );
        }

        // Transporte
        createEntry(
                "Conta Corrente Nubank", "Transporte", EntryNature.OPERATIONAL,
                randomAmount(30000, 50000), // R$ 300 - R$ 500
                month.atDay(20).atTime(18, 0),
                "Combustível e manutenção"
        );

        // Utilidades (luz, água, internet)
        createEntry(
                "Conta Corrente Itaú", "Utilidades", EntryNature.OPERATIONAL,
                randomAmount(25000, 40000), // R$ 250 - R$ 400
                month.atDay(15).atTime(10, 0),
                "Conta de luz"
        );
        createEntry(
                "Conta Corrente Itaú", "Utilidades", EntryNature.OPERATIONAL,
                randomAmount(8000, 15000), // R$ 80 - R$ 150
                month.atDay(18).atTime(10, 0),
                "Conta de água"
        );
        createEntry(
                "Conta Corrente Nubank", "Utilidades", EntryNature.OPERATIONAL,
                14990L, // R$ 149,90
                month.atDay(10).atTime(10, 0),
                "Internet fibra"
        );

        // Assinaturas
        createEntry(
                "Conta Corrente Nubank", "Assinaturas", EntryNature.OPERATIONAL,
                5590L, // R$ 55,90
                month.atDay(1).atTime(3, 0),
                "Netflix"
        );
        createEntry(
                "Conta Corrente Nubank", "Assinaturas", EntryNature.OPERATIONAL,
                2190L, // R$ 21,90
                month.atDay(1).atTime(3, 0),
                "Spotify"
        );

        // Saúde (alguns meses)
        if (random.nextBoolean()) {
            createEntry(
                    "Conta Corrente Nubank", "Saúde", EntryNature.OPERATIONAL,
                    randomAmount(10000, 50000), // R$ 100 - R$ 500
                    month.atDay(random.nextInt(25) + 1).atTime(10, 0),
                    randomDescription("Farmácia", "Consulta médica", "Exames")
            );
        }

        // Lazer (fins de semana)
        createEntry(
                "Conta Corrente Nubank", "Lazer", EntryNature.OPERATIONAL,
                randomAmount(15000, 40000), // R$ 150 - R$ 400
                month.atDay(Math.min(random.nextInt(7) + 7, month.lengthOfMonth())).atTime(20, 0),
                randomDescription("Cinema", "Bar", "Show", "Passeio")
        );

        // === LANÇAMENTOS PATRIMONIAIS ===

        // Dividendos (trimestral)
        if (month.getMonthValue() % 3 == 0) {
            createEntry(
                    "Ações", "Dividendos", EntryNature.PATRIMONIAL,
                    randomAmount(50000, 150000), // R$ 500 - R$ 1.500
                    month.atDay(15).atTime(10, 0),
                    "Dividendos carteira ações"
            );
            createEntry(
                    "FIIs", "Dividendos", EntryNature.PATRIMONIAL,
                    randomAmount(30000, 80000), // R$ 300 - R$ 800
                    month.atDay(15).atTime(10, 0),
                    "Rendimentos FIIs"
            );
        }

        // Rendimentos CDB (mensal)
        createEntry(
                "CDB Nubank", "Rendimentos", EntryNature.PATRIMONIAL,
                randomAmount(15000, 25000), // R$ 150 - R$ 250
                month.atDay(month.lengthOfMonth()).atTime(23, 59),
                "Rendimento CDB"
        );

        // Rendimentos Tesouro Selic (mensal)
        createEntry(
                "Tesouro Selic", "Rendimentos", EntryNature.PATRIMONIAL,
                randomAmount(20000, 35000), // R$ 200 - R$ 350
                month.atDay(month.lengthOfMonth()).atTime(23, 59),
                "Rendimento Tesouro Selic"
        );

        // Aporte em investimentos (mensal)
        createEntry(
                "CDB Nubank", "Aporte Investimento", EntryNature.PATRIMONIAL,
                200000L, // R$ 2.000,00
                month.atDay(6).atTime(10, 0),
                "Aporte mensal CDB"
        );

        // Aporte Previdência (mensal)
        createEntry(
                "Previdência Privada", "Aporte Investimento", EntryNature.PATRIMONIAL,
                100000L, // R$ 1.000,00
                month.atDay(7).atTime(10, 0),
                "Aporte previdência"
        );

        // === CARTÃO DE CRÉDITO ===

        // Despesas no cartão (várias)
        for (int i = 0; i < 5; i++) {
            int day = Math.min(1 + (i * 5) + random.nextInt(5), month.lengthOfMonth());
            String[] cartoes = {"Cartão Nubank", "Cartão Itaú"};
            createEntry(
                    cartoes[random.nextInt(2)],
                    randomDescription("Alimentação", "Vestuário", "Lazer", "Outros"),
                    EntryNature.OPERATIONAL,
                    randomAmount(5000, 30000), // R$ 50 - R$ 300
                    month.atDay(day).atTime(random.nextInt(20) + 4, random.nextInt(60)),
                    "Compra cartão"
            );
        }
    }

    private void createEntry(String walletName, String categoryName, EntryNature nature,
                              long amount, LocalDateTime occurredAt, String description) {
        var wallet = wallets.get(walletName);
        var category = categories.get(categoryName);

        if (wallet == null || category == null) {
            log.warn("Carteira ou categoria não encontrada: {} / {}", walletName, categoryName);
            return;
        }

        entryService.create(new CreateEntryCommand(
                wallet.getId(),
                category.getId(),
                nature,
                null,
                amount,
                occurredAt,
                description
        ));
    }

    private void createTransfers() {
        log.info("Criando transferências...");

        int currentYear = YearMonth.now().getYear();

        // Transferências para todos os meses do ano corrente
        for (int m = 1; m <= 12; m++) {
            var month = YearMonth.of(currentYear, m);

            // Transferência entre contas correntes (mensal)
            createTransfer(
                    "Conta Corrente Itaú", "Conta Corrente Nubank",
                    300000L, // R$ 3.000,00
                    month.atDay(6).atTime(11, 0),
                    "Transferência para despesas"
            );

            // Resgate de investimento (a cada 2 meses)
            if (m % 2 == 0) {
                createTransfer(
                        "CDB Nubank", "Conta Corrente Nubank",
                        100000L, // R$ 1.000,00
                        month.atDay(20).atTime(15, 0),
                        "Resgate parcial CDB"
                );
            }

            // Transferência para dinheiro em espécie (trimestral)
            if (m % 3 == 0) {
                createTransfer(
                        "Conta Corrente Nubank", "Dinheiro em Espécie",
                        50000L, // R$ 500,00
                        month.atDay(15).atTime(14, 0),
                        "Saque para despesas em dinheiro"
                );
            }
        }

        log.info("Transferências criadas com sucesso!");
    }

    private void createTransfer(String fromWalletName, String toWalletName,
                                 long amount, LocalDateTime occurredAt, String description) {
        var fromWallet = wallets.get(fromWalletName);
        var toWallet = wallets.get(toWalletName);
        var fromCategory = categories.get("Transferência Saída");
        var toCategory = categories.get("Transferência Entrada");

        if (fromWallet == null || toWallet == null) {
            log.warn("Carteira não encontrada para transferência: {} -> {}", fromWalletName, toWalletName);
            return;
        }

        transferService.create(new CreateTransferCommand(
                fromWallet.getId(),
                toWallet.getId(),
                fromCategory.getId(),
                toCategory.getId(),
                amount,
                occurredAt,
                description
        ));
    }

    private void createCashFlowConfig() {
        log.info("Criando configurações de fluxo de caixa...");

        int currentYear = YearMonth.now().getYear();

        // Configurar saldo inicial e caixa mínimo para cada mês do ano
        for (int m = 1; m <= 12; m++) {
            var month = YearMonth.of(currentYear, m);

            // Saldo inicial aumentando gradualmente ao longo do ano
            long openingBalance = 500000L + (m - 1) * 50000L; // R$ 5.000 + R$ 500/mês

            // Caixa mínimo fixo
            long minimumCash = 300000L; // R$ 3.000,00

            cashFlowService.updateCashFlowConfig(new UpdateCashFlowConfigCommand(
                    month,
                    openingBalance,
                    minimumCash
            ));
        }

        log.info("Configurações de fluxo de caixa criadas!");
    }

    private long randomAmount(long min, long max) {
        return min + (long) (random.nextDouble() * (max - min));
    }

    private String randomDescription(String... options) {
        return options[random.nextInt(options.length)];
    }
}
