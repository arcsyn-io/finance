package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.CreateEntryCommand;
import com.lucaskalb.finance.dto.UpdateEntryCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.EntryNotFoundException;
import com.lucaskalb.finance.exception.InvalidEntryException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.model.CategoryType;
import com.lucaskalb.finance.model.Entry;
import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.model.EntryNature;
import com.lucaskalb.finance.repository.CategoryRepository;
import com.lucaskalb.finance.repository.EntryRepository;
import com.lucaskalb.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EntryService {

    private final EntryRepository entryRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<Entry> list(LocalDateTime startDate, LocalDateTime endDate,
                            Long walletId, Long categoryId, EntryNature nature,
                            boolean includeDeleted) {
        return entryRepository.listByPeriod(startDate, endDate, walletId, categoryId, nature, includeDeleted);
    }

    @Transactional(readOnly = true)
    public Entry findById(long id) {
        return entryRepository.findById(id)
                .orElseThrow(() -> new EntryNotFoundException(id));
    }

    @Transactional
    public Entry create(CreateEntryCommand command) {
        validateAmount(command.amount());
        validateOccurredAt(command.occurredAt());
        validateNature(command.nature());

        var wallet = walletRepository.findById(command.walletId())
                .orElseThrow(() -> new WalletNotFoundException(command.walletId()));

        if (!wallet.isActive()) {
            throw new InvalidEntryException("Carteira inativa não pode receber lançamentos");
        }

        var category = categoryRepository.findById(command.categoryId())
                .orElseThrow(CategoryNotFoundException::new);

        var direction = inferDirection(category.getType());

        var id = entryRepository.insert(
                command.walletId(),
                command.categoryId(),
                command.nature(),
                direction,
                command.amount(),
                command.occurredAt(),
                command.description()
        );

        return entryRepository.findById(id).orElseThrow();
    }

    @Transactional
    public Entry update(UpdateEntryCommand command) {
        validateAmount(command.amount());
        validateOccurredAt(command.occurredAt());
        validateNature(command.nature());

        entryRepository.findById(command.id())
                .orElseThrow(() -> new EntryNotFoundException(command.id()));

        var wallet = walletRepository.findById(command.walletId())
                .orElseThrow(() -> new WalletNotFoundException(command.walletId()));

        if (!wallet.isActive()) {
            throw new InvalidEntryException("Carteira inativa não pode receber lançamentos");
        }

        var category = categoryRepository.findById(command.categoryId())
                .orElseThrow(CategoryNotFoundException::new);

        var direction = inferDirection(category.getType());

        entryRepository.update(
                command.id(),
                command.walletId(),
                command.categoryId(),
                command.nature(),
                direction,
                command.amount(),
                command.occurredAt(),
                command.description()
        );

        return entryRepository.findById(command.id()).orElseThrow();
    }

    @Transactional
    public void delete(long id) {
        var entry = entryRepository.findById(id)
                .orElseThrow(() -> new EntryNotFoundException(id));

        if (entry.isDeleted()) {
            throw new InvalidEntryException("Lançamento já está excluído");
        }

        entryRepository.softDelete(id);
    }

    @Transactional
    public void restore(long id) {
        var entry = entryRepository.findById(id)
                .orElseThrow(() -> new EntryNotFoundException(id));

        if (!entry.isDeleted()) {
            throw new InvalidEntryException("Lançamento não está excluído");
        }

        entryRepository.restore(id);
    }

    private void validateAmount(long amount) {
        if (amount <= 0) {
            throw new InvalidEntryException("Valor deve ser maior que zero");
        }
    }

    private void validateOccurredAt(LocalDateTime occurredAt) {
        if (occurredAt == null) {
            throw new InvalidEntryException("Data do lançamento é obrigatória");
        }
    }

    private void validateNature(EntryNature nature) {
        if (nature == null) {
            throw new InvalidEntryException("Natureza do lançamento é obrigatória");
        }
    }

    private EntryDirection inferDirection(CategoryType categoryType) {
        return categoryType == CategoryType.INCOME ? EntryDirection.IN : EntryDirection.OUT;
    }
}
