package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.CreateWalletCommand;
import com.lucaskalb.finance.dto.UpdateWalletCommand;
import com.lucaskalb.finance.exception.DuplicateWalletNameException;
import com.lucaskalb.finance.exception.InvalidWalletException;
import com.lucaskalb.finance.exception.WalletNotFoundException;
import com.lucaskalb.finance.model.Wallet;
import com.lucaskalb.finance.model.WalletType;
import com.lucaskalb.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;

    @Transactional(readOnly = true)
    public List<Wallet> listActive() {
        return walletRepository.listAll(false);
    }

    @Transactional(readOnly = true)
    public List<Wallet> listAll() {
        return walletRepository.listAll(true);
    }

    @Transactional(readOnly = true)
    public Wallet findById(long id) {
        return walletRepository.findById(id)
                .orElseThrow(WalletNotFoundException::new);
    }

    @Transactional
    public Wallet create(CreateWalletCommand command) {
        var normalizedName = validateAndNormalizeName(command.name());
        validateType(command.type());

        if (walletRepository.findByName(normalizedName).isPresent()) {
            throw new DuplicateWalletNameException();
        }

        var id = walletRepository.insert(normalizedName, command.type());
        return walletRepository.findById(id).orElseThrow();
    }

    @Transactional
    public Wallet update(UpdateWalletCommand command) {
        var normalizedName = validateAndNormalizeName(command.name());
        validateType(command.type());

        var existing = walletRepository.findById(command.id())
                .orElseThrow(WalletNotFoundException::new);

        var duplicate = walletRepository.findByName(normalizedName);
        if (duplicate.isPresent() && !duplicate.get().getId().equals(command.id())) {
            throw new DuplicateWalletNameException();
        }

        walletRepository.update(command.id(), normalizedName, command.type(), command.active());
        return walletRepository.findById(command.id()).orElseThrow();
    }

    @Transactional
    public void deactivate(long id) {
        walletRepository.findById(id)
                .orElseThrow(WalletNotFoundException::new);

        walletRepository.setActive(id, false);
    }

    @Transactional
    public void activate(long id) {
        walletRepository.findById(id)
                .orElseThrow(WalletNotFoundException::new);

        walletRepository.setActive(id, true);
    }

    private String validateAndNormalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new InvalidWalletException("Nome da carteira é obrigatório");
        }
        return name.trim();
    }

    private void validateType(WalletType type) {
        if (type == null) {
            throw new InvalidWalletException("Tipo da carteira é obrigatório");
        }
    }
}
