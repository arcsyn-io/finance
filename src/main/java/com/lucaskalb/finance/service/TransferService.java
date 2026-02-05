package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.CreateTransferCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.InvalidTransferException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.model.CategoryType;
import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.model.Transfer;
import com.lucaskalb.finance.repository.CategoryRepository;
import com.lucaskalb.finance.repository.EntryRepository;
import com.lucaskalb.finance.repository.TransferRepository;
import com.lucaskalb.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final TransferRepository transferRepository;
    private final EntryRepository entryRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public Transfer create(CreateTransferCommand command) {
        validateAmount(command.amount());
        validateOccurredAt(command.occurredAt());
        validateDifferentWallets(command.fromWalletId(), command.toWalletId());

        var fromWallet = walletRepository.findById(command.fromWalletId())
                .orElseThrow(() -> new WalletNotFoundException(command.fromWalletId()));
        var toWallet = walletRepository.findById(command.toWalletId())
                .orElseThrow(() -> new WalletNotFoundException(command.toWalletId()));

        if (!fromWallet.isActive()) {
            throw new InvalidTransferException("Carteira de origem está inativa");
        }
        if (!toWallet.isActive()) {
            throw new InvalidTransferException("Carteira de destino está inativa");
        }

        var fromCategory = categoryRepository.findById(command.fromCategoryId())
                .orElseThrow(CategoryNotFoundException::new);
        var toCategory = categoryRepository.findById(command.toCategoryId())
                .orElseThrow(CategoryNotFoundException::new);

        if (fromCategory.getType() != CategoryType.EXPENSE) {
            throw new InvalidTransferException("Categoria de origem deve ser do tipo Despesa");
        }
        if (toCategory.getType() != CategoryType.INCOME) {
            throw new InvalidTransferException("Categoria de destino deve ser do tipo Receita");
        }

        var transferId = transferRepository.insert(
                command.fromWalletId(),
                command.toWalletId(),
                command.fromCategoryId(),
                command.toCategoryId(),
                command.amount(),
                command.occurredAt(),
                command.description()
        );

        var outDescription = buildDescription(command.description(), "para", toWallet.getName());
        entryRepository.insertWithTransfer(
                command.fromWalletId(),
                command.fromCategoryId(),
                EntryNature.OPERATIONAL,
                EntryDirection.OUT,
                command.amount(),
                command.occurredAt(),
                outDescription,
                transferId
        );

        var inDescription = buildDescription(command.description(), "de", fromWallet.getName());
        entryRepository.insertWithTransfer(
                command.toWalletId(),
                command.toCategoryId(),
                EntryNature.OPERATIONAL,
                EntryDirection.IN,
                command.amount(),
                command.occurredAt(),
                inDescription,
                transferId
        );

        return transferRepository.findById(transferId).orElseThrow();
    }

    private void validateAmount(long amount) {
        if (amount <= 0) {
            throw new InvalidTransferException("Valor deve ser maior que zero");
        }
    }

    private void validateOccurredAt(java.time.LocalDateTime occurredAt) {
        if (occurredAt == null) {
            throw new InvalidTransferException("Data da transferência é obrigatória");
        }
    }

    private void validateDifferentWallets(long fromWalletId, long toWalletId) {
        if (fromWalletId == toWalletId) {
            throw new InvalidTransferException("Carteiras de origem e destino devem ser diferentes");
        }
    }

    private String buildDescription(String baseDescription, String preposition, String walletName) {
        if (baseDescription == null || baseDescription.isBlank()) {
            return "Transferência " + preposition + " " + walletName;
        }
        return baseDescription + " (" + preposition + " " + walletName + ")";
    }
}
