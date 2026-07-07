package com.lucaskalb.finance.service;

import com.lucaskalb.finance.exception.*;
import com.lucaskalb.finance.model.Account;
import com.lucaskalb.finance.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountService {

    private static final int MIN_USERNAME_LENGTH = 3;
    private static final int MAX_USERNAME_LENGTH = 50;
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Account createAccount(String username, String password) {
        var normalizedUsername = validateAndNormalizeUsername(username);
        validatePassword(password);

        if (accountRepository.existsByUsername(normalizedUsername)) {
            throw new UsernameAlreadyExistsException("Username já está em uso");
        }

        var passwordHash = passwordEncoder.encode(password);
        return accountRepository.save(normalizedUsername, passwordHash);
    }

    @Transactional(readOnly = true)
    public Account authenticate(String username, String password) {
        if (username == null || password == null) {
            throw new AuthenticationFailedException();
        }

        var account = accountRepository.findByUsername(username.trim())
                .orElseThrow(AuthenticationFailedException::new);

        if (!account.isEnabled()) {
            throw new AuthenticationFailedException();
        }

        if (!passwordEncoder.matches(password, account.getPassword())) {
            throw new AuthenticationFailedException();
        }

        return account;
    }

    @Transactional
    public void disableAccount(Integer accountId) {
        var account = accountRepository.findById(accountId)
                .orElseThrow(AccountNotFoundException::new);

        if (!account.isEnabled()) {
            throw new AccountDisabledException();
        }

        accountRepository.updateEnabled(accountId, false);
    }

    @Transactional
    public void changePassword(Integer accountId, String currentPassword, String newPassword) {
        var account = accountRepository.findById(accountId)
                .orElseThrow(AccountNotFoundException::new);

        if (!account.isEnabled()) {
            throw new AccountDisabledException();
        }

        if (!passwordEncoder.matches(currentPassword, account.getPassword())) {
            throw new AuthenticationFailedException();
        }

        validatePassword(newPassword);

        if (passwordEncoder.matches(newPassword, account.getPassword())) {
            throw new InvalidPasswordException("A nova senha deve ser diferente da atual");
        }

        var newPasswordHash = passwordEncoder.encode(newPassword);
        accountRepository.updatePassword(accountId, newPasswordHash);
    }

    private String validateAndNormalizeUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new InvalidUsernameException("Username não pode ser vazio");
        }

        var normalized = username.trim();

        if (normalized.length() < MIN_USERNAME_LENGTH) {
            throw new InvalidUsernameException("Username deve ter pelo menos " + MIN_USERNAME_LENGTH + " caracteres");
        }

        if (normalized.length() > MAX_USERNAME_LENGTH) {
            throw new InvalidUsernameException("Username deve ter no máximo " + MAX_USERNAME_LENGTH + " caracteres");
        }

        return normalized;
    }

    private void validatePassword(String password) {
        if (password == null) {
            throw new InvalidPasswordException("Senha não pode ser nula");
        }

        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new InvalidPasswordException("Senha deve ter pelo menos " + MIN_PASSWORD_LENGTH + " caracteres");
        }
    }
}
