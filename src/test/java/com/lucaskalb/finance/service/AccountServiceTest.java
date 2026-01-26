package com.lucaskalb.finance.service;

import com.lucaskalb.finance.exception.*;
import com.lucaskalb.finance.model.Account;
import com.lucaskalb.finance.repository.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AccountService accountService;

    private Account createTestAccount(Integer id, String username, boolean enabled) {
        return Account.builder()
                .id(id)
                .username(username)
                .password("hashedPassword")
                .enabled(enabled)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("createAccount")
    class CreateAccountTests {

        @Test
        @DisplayName("deve criar conta com sucesso")
        void shouldCreateAccountSuccessfully() {
            var username = "johndoe";
            var password = "password123";
            var expectedAccount = createTestAccount(1, username, true);

            when(accountRepository.existsByUsername(username)).thenReturn(false);
            when(passwordEncoder.encode(password)).thenReturn("hashedPassword");
            when(accountRepository.save(username, "hashedPassword")).thenReturn(expectedAccount);

            var result = accountService.createAccount(username, password);

            assertThat(result).isNotNull();
            assertThat(result.getUsername()).isEqualTo(username);
            verify(accountRepository).save(username, "hashedPassword");
        }

        @Test
        @DisplayName("deve normalizar username com espaços")
        void shouldNormalizeUsernameWithSpaces() {
            var username = "  johndoe  ";
            var normalizedUsername = "johndoe";
            var password = "password123";
            var expectedAccount = createTestAccount(1, normalizedUsername, true);

            when(accountRepository.existsByUsername(normalizedUsername)).thenReturn(false);
            when(passwordEncoder.encode(password)).thenReturn("hashedPassword");
            when(accountRepository.save(normalizedUsername, "hashedPassword")).thenReturn(expectedAccount);

            var result = accountService.createAccount(username, password);

            assertThat(result.getUsername()).isEqualTo(normalizedUsername);
            verify(accountRepository).save(normalizedUsername, "hashedPassword");
        }

        @Test
        @DisplayName("deve lançar exceção quando username é nulo")
        void shouldThrowWhenUsernameIsNull() {
            assertThatThrownBy(() -> accountService.createAccount(null, "password123"))
                    .isInstanceOf(InvalidUsernameException.class)
                    .hasMessage("Username não pode ser vazio");

            verify(accountRepository, never()).save(anyString(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando username é vazio")
        void shouldThrowWhenUsernameIsEmpty() {
            assertThatThrownBy(() -> accountService.createAccount("", "password123"))
                    .isInstanceOf(InvalidUsernameException.class)
                    .hasMessage("Username não pode ser vazio");

            verify(accountRepository, never()).save(anyString(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando username é apenas espaços")
        void shouldThrowWhenUsernameIsBlank() {
            assertThatThrownBy(() -> accountService.createAccount("   ", "password123"))
                    .isInstanceOf(InvalidUsernameException.class)
                    .hasMessage("Username não pode ser vazio");

            verify(accountRepository, never()).save(anyString(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando username tem menos de 3 caracteres")
        void shouldThrowWhenUsernameTooShort() {
            assertThatThrownBy(() -> accountService.createAccount("ab", "password123"))
                    .isInstanceOf(InvalidUsernameException.class)
                    .hasMessage("Username deve ter pelo menos 3 caracteres");

            verify(accountRepository, never()).save(anyString(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando username tem mais de 50 caracteres")
        void shouldThrowWhenUsernameTooLong() {
            var longUsername = "a".repeat(51);

            assertThatThrownBy(() -> accountService.createAccount(longUsername, "password123"))
                    .isInstanceOf(InvalidUsernameException.class)
                    .hasMessage("Username deve ter no máximo 50 caracteres");

            verify(accountRepository, never()).save(anyString(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando password é nula")
        void shouldThrowWhenPasswordIsNull() {
            assertThatThrownBy(() -> accountService.createAccount("johndoe", null))
                    .isInstanceOf(InvalidPasswordException.class)
                    .hasMessage("Senha não pode ser nula");

            verify(accountRepository, never()).save(anyString(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando password tem menos de 8 caracteres")
        void shouldThrowWhenPasswordTooShort() {
            assertThatThrownBy(() -> accountService.createAccount("johndoe", "1234567"))
                    .isInstanceOf(InvalidPasswordException.class)
                    .hasMessage("Senha deve ter pelo menos 8 caracteres");

            verify(accountRepository, never()).save(anyString(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando username já existe")
        void shouldThrowWhenUsernameAlreadyExists() {
            when(accountRepository.existsByUsername("johndoe")).thenReturn(true);

            assertThatThrownBy(() -> accountService.createAccount("johndoe", "password123"))
                    .isInstanceOf(UsernameAlreadyExistsException.class)
                    .hasMessage("Username já está em uso");

            verify(accountRepository, never()).save(anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("authenticate")
    class AuthenticateTests {

        @Test
        @DisplayName("deve autenticar com sucesso")
        void shouldAuthenticateSuccessfully() {
            var username = "johndoe";
            var password = "password123";
            var account = createTestAccount(1, username, true);

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches(password, account.getPassword())).thenReturn(true);

            var result = accountService.authenticate(username, password);

            assertThat(result).isNotNull();
            assertThat(result.getUsername()).isEqualTo(username);
        }

        @Test
        @DisplayName("deve normalizar username com espaços na autenticação")
        void shouldTrimUsernameOnAuthentication() {
            var username = "  johndoe  ";
            var password = "password123";
            var account = createTestAccount(1, "johndoe", true);

            when(accountRepository.findByUsername("johndoe")).thenReturn(Optional.of(account));
            when(passwordEncoder.matches(password, account.getPassword())).thenReturn(true);

            var result = accountService.authenticate(username, password);

            assertThat(result).isNotNull();
            verify(accountRepository).findByUsername("johndoe");
        }

        @Test
        @DisplayName("deve lançar exceção quando username é nulo")
        void shouldThrowWhenUsernameIsNull() {
            assertThatThrownBy(() -> accountService.authenticate(null, "password123"))
                    .isInstanceOf(AuthenticationFailedException.class);

            verify(accountRepository, never()).findByUsername(anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando password é nula")
        void shouldThrowWhenPasswordIsNull() {
            assertThatThrownBy(() -> accountService.authenticate("johndoe", null))
                    .isInstanceOf(AuthenticationFailedException.class);

            verify(accountRepository, never()).findByUsername(anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando conta não existe")
        void shouldThrowWhenAccountNotFound() {
            when(accountRepository.findByUsername("johndoe")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> accountService.authenticate("johndoe", "password123"))
                    .isInstanceOf(AuthenticationFailedException.class);
        }

        @Test
        @DisplayName("deve lançar exceção quando conta está desabilitada")
        void shouldThrowWhenAccountIsDisabled() {
            var account = createTestAccount(1, "johndoe", false);
            when(accountRepository.findByUsername("johndoe")).thenReturn(Optional.of(account));

            assertThatThrownBy(() -> accountService.authenticate("johndoe", "password123"))
                    .isInstanceOf(AuthenticationFailedException.class);

            verify(passwordEncoder, never()).matches(anyString(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando senha está incorreta")
        void shouldThrowWhenPasswordIsWrong() {
            var account = createTestAccount(1, "johndoe", true);
            when(accountRepository.findByUsername("johndoe")).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("wrongpassword", account.getPassword())).thenReturn(false);

            assertThatThrownBy(() -> accountService.authenticate("johndoe", "wrongpassword"))
                    .isInstanceOf(AuthenticationFailedException.class);
        }
    }

    @Nested
    @DisplayName("disableAccount")
    class DisableAccountTests {

        @Test
        @DisplayName("deve desabilitar conta com sucesso")
        void shouldDisableAccountSuccessfully() {
            var account = createTestAccount(1, "johndoe", true);
            when(accountRepository.findById(1)).thenReturn(Optional.of(account));

            accountService.disableAccount(1);

            verify(accountRepository).updateEnabled(1, false);
        }

        @Test
        @DisplayName("deve lançar exceção quando conta não existe")
        void shouldThrowWhenAccountNotFound() {
            when(accountRepository.findById(1)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> accountService.disableAccount(1))
                    .isInstanceOf(AccountNotFoundException.class);

            verify(accountRepository, never()).updateEnabled(any(), anyBoolean());
        }

        @Test
        @DisplayName("deve lançar exceção quando conta já está desabilitada")
        void shouldThrowWhenAccountAlreadyDisabled() {
            var account = createTestAccount(1, "johndoe", false);
            when(accountRepository.findById(1)).thenReturn(Optional.of(account));

            assertThatThrownBy(() -> accountService.disableAccount(1))
                    .isInstanceOf(AccountDisabledException.class);

            verify(accountRepository, never()).updateEnabled(any(), anyBoolean());
        }
    }

    @Nested
    @DisplayName("changePassword")
    class ChangePasswordTests {

        @Test
        @DisplayName("deve trocar senha com sucesso")
        void shouldChangePasswordSuccessfully() {
            var account = createTestAccount(1, "johndoe", true);
            var currentPassword = "oldpassword123";
            var newPassword = "newpassword123";

            when(accountRepository.findById(1)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches(currentPassword, account.getPassword())).thenReturn(true);
            when(passwordEncoder.matches(newPassword, account.getPassword())).thenReturn(false);
            when(passwordEncoder.encode(newPassword)).thenReturn("newHashedPassword");

            accountService.changePassword(1, currentPassword, newPassword);

            verify(accountRepository).updatePassword(1, "newHashedPassword");
        }

        @Test
        @DisplayName("deve lançar exceção quando conta não existe")
        void shouldThrowWhenAccountNotFound() {
            when(accountRepository.findById(1)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> accountService.changePassword(1, "old", "newpassword123"))
                    .isInstanceOf(AccountNotFoundException.class);

            verify(accountRepository, never()).updatePassword(any(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando conta está desabilitada")
        void shouldThrowWhenAccountIsDisabled() {
            var account = createTestAccount(1, "johndoe", false);
            when(accountRepository.findById(1)).thenReturn(Optional.of(account));

            assertThatThrownBy(() -> accountService.changePassword(1, "old", "newpassword123"))
                    .isInstanceOf(AccountDisabledException.class);

            verify(accountRepository, never()).updatePassword(any(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando senha atual está incorreta")
        void shouldThrowWhenCurrentPasswordIsWrong() {
            var account = createTestAccount(1, "johndoe", true);
            when(accountRepository.findById(1)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("wrongpassword", account.getPassword())).thenReturn(false);

            assertThatThrownBy(() -> accountService.changePassword(1, "wrongpassword", "newpassword123"))
                    .isInstanceOf(AuthenticationFailedException.class);

            verify(accountRepository, never()).updatePassword(any(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando nova senha tem menos de 8 caracteres")
        void shouldThrowWhenNewPasswordTooShort() {
            var account = createTestAccount(1, "johndoe", true);
            when(accountRepository.findById(1)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("oldpassword123", account.getPassword())).thenReturn(true);

            assertThatThrownBy(() -> accountService.changePassword(1, "oldpassword123", "short"))
                    .isInstanceOf(InvalidPasswordException.class)
                    .hasMessage("Senha deve ter pelo menos 8 caracteres");

            verify(accountRepository, never()).updatePassword(any(), anyString());
        }

        @Test
        @DisplayName("deve lançar exceção quando nova senha é igual à atual")
        void shouldThrowWhenNewPasswordSameAsOld() {
            var account = createTestAccount(1, "johndoe", true);
            var password = "samepassword123";

            when(accountRepository.findById(1)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches(password, account.getPassword())).thenReturn(true);

            assertThatThrownBy(() -> accountService.changePassword(1, password, password))
                    .isInstanceOf(InvalidPasswordException.class)
                    .hasMessage("A nova senha deve ser diferente da atual");

            verify(accountRepository, never()).updatePassword(any(), anyString());
        }
    }
}
