package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.CreateTransferCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.InvalidTransferException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.model.*;
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

    @Transactional(readOnly = true)
    public Transfer findById(long id) {
        return transferRepository.findById(id)
                .orElseThrow(() -> new InvalidTransferException("Transferência não encontrada"));
    }

    @Transactional
    public void unlink(long id) {
        transferRepository.findById(id)
                .orElseThrow(() -> new InvalidTransferException("Transferência não encontrada"));

        var entries = entryRepository.findByTransferId(id);
        for (var entry : entries) {
            entryRepository.clearTransferId(entry.getId());
        }

        transferRepository.delete(id);
    }

    @Transactional
    public Transfer update(long id, long fromWalletId, long toWalletId, long fromCategoryId, long toCategoryId,
                           long amount, java.time.LocalDateTime occurredAt, String description) {
        var transfer = transferRepository.findById(id)
                .orElseThrow(() -> new InvalidTransferException("Transferência não encontrada"));

        validateAmount(amount);
        validateOccurredAt(occurredAt);
        validateDifferentWallets(fromWalletId, toWalletId);

        var fromWallet = walletRepository.findById(fromWalletId)
                .orElseThrow(() -> new WalletNotFoundException(fromWalletId));
        var toWallet = walletRepository.findById(toWalletId)
                .orElseThrow(() -> new WalletNotFoundException(toWalletId));

        if (!fromWallet.isActive()) {
            throw new InvalidTransferException("Carteira de origem está inativa");
        }
        if (!toWallet.isActive()) {
            throw new InvalidTransferException("Carteira de destino está inativa");
        }

        var fromCategory = categoryRepository.findById(fromCategoryId)
                .orElseThrow(CategoryNotFoundException::new);
        var toCategory = categoryRepository.findById(toCategoryId)
                .orElseThrow(CategoryNotFoundException::new);

        if (fromCategory.getType() != CategoryType.EXPENSE) {
            throw new InvalidTransferException("Categoria de origem deve ser do tipo Despesa");
        }
        if (toCategory.getType() != CategoryType.INCOME) {
            throw new InvalidTransferException("Categoria de destino deve ser do tipo Receita");
        }

        transferRepository.update(id, fromWalletId, toWalletId, fromCategoryId, toCategoryId,
                amount, occurredAt, description);

        // Atualiza os entries vinculados
        var entries = entryRepository.findByTransferId(id);
        for (var entry : entries) {
            if (entry.getDirection() == EntryDirection.OUT) {
                var outDescription = buildDescription(description, "para", toWallet.getName());
                entryRepository.update(entry.getId(), fromWalletId, fromCategoryId,
                        entry.getNature(), EntryDirection.OUT, amount, occurredAt,
                        outDescription, EconomicEvent.TRANSFER);
            } else {
                var inDescription = buildDescription(description, "de", fromWallet.getName());
                entryRepository.update(entry.getId(), toWalletId, toCategoryId,
                        entry.getNature(), EntryDirection.IN, amount, occurredAt,
                        inDescription, EconomicEvent.TRANSFER);
            }
        }

        return transferRepository.findById(id).orElseThrow();
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

    /**
     * Cria um novo lançamento e vincula ao existente como transferência.
     * Herda amount e occurredAt do source entry.
     */
    @Transactional
    public Transfer createAndLink(long sourceEntryId, long walletId, long categoryId,
                                   EntryNature nature, String description) {
        var sourceEntry = entryRepository.findById(sourceEntryId)
                .orElseThrow(() -> new InvalidTransferException("Lançamento de origem não encontrado"));

        if (sourceEntry.isDeleted()) {
            throw new InvalidTransferException("Lançamento de origem está excluído");
        }
        if (sourceEntry.getTransferId() != null) {
            throw new InvalidTransferException("Lançamento já está vinculado a uma transferência");
        }

        var targetWallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new WalletNotFoundException(walletId));
        if (!targetWallet.isActive()) {
            throw new InvalidTransferException("Carteira selecionada está inativa");
        }
        if (sourceEntry.getWalletId().equals(walletId)) {
            throw new InvalidTransferException("Carteira deve ser diferente da carteira de origem");
        }

        var category = categoryRepository.findById(categoryId)
                .orElseThrow(CategoryNotFoundException::new);

        // Direção do novo entry é oposta à do source
        var expectedType = sourceEntry.getDirection() == EntryDirection.OUT
                ? CategoryType.INCOME : CategoryType.EXPENSE;
        if (category.getType() != expectedType) {
            throw new InvalidTransferException("Categoria deve ser do tipo " +
                    (expectedType == CategoryType.INCOME ? "Receita" : "Despesa"));
        }

        var newDirection = sourceEntry.getDirection() == EntryDirection.OUT
                ? EntryDirection.IN : EntryDirection.OUT;

        // Determina from/to pela direção do source
        long fromWalletId, toWalletId, fromCategoryId, toCategoryId;
        if (sourceEntry.getDirection() == EntryDirection.OUT) {
            fromWalletId = sourceEntry.getWalletId();
            toWalletId = walletId;
            fromCategoryId = sourceEntry.getCategoryId();
            toCategoryId = categoryId;
        } else {
            fromWalletId = walletId;
            toWalletId = sourceEntry.getWalletId();
            fromCategoryId = categoryId;
            toCategoryId = sourceEntry.getCategoryId();
        }

        var transferId = transferRepository.insert(
                fromWalletId, toWalletId, fromCategoryId, toCategoryId,
                sourceEntry.getAmount(), sourceEntry.getOccurredAt(), description
        );

        // Cria o novo entry
        entryRepository.insertWithTransfer(
                walletId, categoryId, nature, newDirection,
                sourceEntry.getAmount(), sourceEntry.getOccurredAt(),
                description, transferId
        );

        // Atualiza o source entry com o transferId
        entryRepository.updateTransferId(sourceEntryId, transferId);

        return transferRepository.findById(transferId).orElseThrow();
    }

    /**
     * Vincula dois lançamentos existentes como uma transferência.
     */
    @Transactional
    public Transfer linkEntries(long sourceEntryId, long targetEntryId) {
        var sourceEntry = entryRepository.findById(sourceEntryId)
                .orElseThrow(() -> new InvalidTransferException("Lançamento de origem não encontrado"));
        var targetEntry = entryRepository.findById(targetEntryId)
                .orElseThrow(() -> new InvalidTransferException("Lançamento de destino não encontrado"));

        // Validações
        if (sourceEntry.isDeleted() || targetEntry.isDeleted()) {
            throw new InvalidTransferException("Não é possível vincular lançamentos excluídos");
        }
        if (sourceEntry.getTransferId() != null || targetEntry.getTransferId() != null) {
            throw new InvalidTransferException("Um dos lançamentos já está vinculado a uma transferência");
        }
        if (sourceEntry.getWalletId().equals(targetEntry.getWalletId())) {
            throw new InvalidTransferException("Os lançamentos devem ser de carteiras diferentes");
        }
        if (sourceEntry.getDirection() == targetEntry.getDirection()) {
            throw new InvalidTransferException("Os lançamentos devem ter direções opostas (um IN e um OUT)");
        }
        if (sourceEntry.getAmount() != targetEntry.getAmount()) {
            throw new InvalidTransferException("Os lançamentos devem ter o mesmo valor");
        }

        // Determina qual é OUT (origem) e qual é IN (destino)
        var outEntry = sourceEntry.getDirection() == EntryDirection.OUT ? sourceEntry : targetEntry;
        var inEntry = sourceEntry.getDirection() == EntryDirection.IN ? sourceEntry : targetEntry;

        // Usa a data mais recente entre os dois
        var occurredAt = outEntry.getOccurredAt().isAfter(inEntry.getOccurredAt())
                ? outEntry.getOccurredAt() : inEntry.getOccurredAt();

        // Cria a transferência
        var transferId = transferRepository.insert(
                outEntry.getWalletId(),
                inEntry.getWalletId(),
                outEntry.getCategoryId(),
                inEntry.getCategoryId(),
                outEntry.getAmount(),
                occurredAt,
                outEntry.getDescription()
        );

        // Vincula os lançamentos
        entryRepository.updateTransferId(outEntry.getId(), transferId);
        entryRepository.updateTransferId(inEntry.getId(), transferId);

        return transferRepository.findById(transferId).orElseThrow();
    }
}
