package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.CreateCategoryCommand;
import com.lucaskalb.finance.dto.UpdateCategoryCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.DuplicateCategoryNameException;
import com.lucaskalb.finance.exception.InvalidCategoryException;
import com.lucaskalb.finance.model.Category;
import com.lucaskalb.finance.model.CategoryType;
import com.lucaskalb.finance.repository.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category createTestCategory(Long id, String name, CategoryType type, boolean active) {
        return Category.builder()
                .id(id)
                .name(name)
                .type(type)
                .active(active)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("listActive")
    class ListActiveTests {

        @Test
        @DisplayName("deve retornar apenas categorias ativas")
        void shouldReturnOnlyActiveCategories() {
            var categories = List.of(
                    createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, true),
                    createTestCategory(2L, "Salário", CategoryType.INCOME, true)
            );
            when(categoryRepository.listAll(false)).thenReturn(categories);

            var result = categoryService.listActive();

            assertThat(result).hasSize(2);
            verify(categoryRepository).listAll(false);
        }
    }

    @Nested
    @DisplayName("listAll")
    class ListAllTests {

        @Test
        @DisplayName("deve retornar todas as categorias incluindo inativas")
        void shouldReturnAllCategories() {
            var categories = List.of(
                    createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, true),
                    createTestCategory(2L, "Salário", CategoryType.INCOME, false)
            );
            when(categoryRepository.listAll(true)).thenReturn(categories);

            var result = categoryService.listAll();

            assertThat(result).hasSize(2);
            verify(categoryRepository).listAll(true);
        }
    }

    @Nested
    @DisplayName("findById")
    class FindByIdTests {

        @Test
        @DisplayName("deve retornar categoria quando existe")
        void shouldReturnCategoryWhenExists() {
            var category = createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, true);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

            var result = categoryService.findById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Alimentação");
        }

        @Test
        @DisplayName("deve lançar exceção quando categoria não existe")
        void shouldThrowWhenCategoryNotFound() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.findById(1L))
                    .isInstanceOf(CategoryNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("create")
    class CreateTests {

        @Test
        @DisplayName("deve criar categoria com sucesso")
        void shouldCreateCategorySuccessfully() {
            var command = new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE);
            var category = createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, true);

            when(categoryRepository.findByName("Alimentação")).thenReturn(Optional.empty());
            when(categoryRepository.insert("Alimentação", CategoryType.EXPENSE)).thenReturn(1L);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

            var result = categoryService.create(command);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Alimentação");
            assertThat(result.getType()).isEqualTo(CategoryType.EXPENSE);
            verify(categoryRepository).insert("Alimentação", CategoryType.EXPENSE);
        }

        @Test
        @DisplayName("deve normalizar nome com espaços")
        void shouldNormalizeNameWithSpaces() {
            var command = new CreateCategoryCommand("  Alimentação  ", CategoryType.EXPENSE);
            var category = createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, true);

            when(categoryRepository.findByName("Alimentação")).thenReturn(Optional.empty());
            when(categoryRepository.insert("Alimentação", CategoryType.EXPENSE)).thenReturn(1L);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

            var result = categoryService.create(command);

            assertThat(result.getName()).isEqualTo("Alimentação");
            verify(categoryRepository).insert("Alimentação", CategoryType.EXPENSE);
        }

        @Test
        @DisplayName("deve lançar exceção quando nome é nulo")
        void shouldThrowWhenNameIsNull() {
            var command = new CreateCategoryCommand(null, CategoryType.EXPENSE);

            assertThatThrownBy(() -> categoryService.create(command))
                    .isInstanceOf(InvalidCategoryException.class)
                    .hasMessage("Nome da categoria é obrigatório");

            verify(categoryRepository, never()).insert(anyString(), any());
        }

        @Test
        @DisplayName("deve lançar exceção quando nome é vazio")
        void shouldThrowWhenNameIsEmpty() {
            var command = new CreateCategoryCommand("", CategoryType.EXPENSE);

            assertThatThrownBy(() -> categoryService.create(command))
                    .isInstanceOf(InvalidCategoryException.class)
                    .hasMessage("Nome da categoria é obrigatório");

            verify(categoryRepository, never()).insert(anyString(), any());
        }

        @Test
        @DisplayName("deve lançar exceção quando nome é apenas espaços")
        void shouldThrowWhenNameIsBlank() {
            var command = new CreateCategoryCommand("   ", CategoryType.EXPENSE);

            assertThatThrownBy(() -> categoryService.create(command))
                    .isInstanceOf(InvalidCategoryException.class)
                    .hasMessage("Nome da categoria é obrigatório");

            verify(categoryRepository, never()).insert(anyString(), any());
        }

        @Test
        @DisplayName("deve lançar exceção quando tipo é nulo")
        void shouldThrowWhenTypeIsNull() {
            var command = new CreateCategoryCommand("Alimentação", null);

            assertThatThrownBy(() -> categoryService.create(command))
                    .isInstanceOf(InvalidCategoryException.class)
                    .hasMessage("Tipo da categoria é obrigatório");

            verify(categoryRepository, never()).insert(anyString(), any());
        }

        @Test
        @DisplayName("deve lançar exceção quando nome já existe")
        void shouldThrowWhenNameAlreadyExists() {
            var command = new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE);
            var existing = createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, true);

            when(categoryRepository.findByName("Alimentação")).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> categoryService.create(command))
                    .isInstanceOf(DuplicateCategoryNameException.class);

            verify(categoryRepository, never()).insert(anyString(), any());
        }
    }

    @Nested
    @DisplayName("update")
    class UpdateTests {

        @Test
        @DisplayName("deve atualizar categoria com sucesso")
        void shouldUpdateCategorySuccessfully() {
            var command = new UpdateCategoryCommand(1L, "Alimentação Atualizada", CategoryType.EXPENSE, true);
            var existing = createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, true);
            var updated = createTestCategory(1L, "Alimentação Atualizada", CategoryType.EXPENSE, true);

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing), Optional.of(updated));
            when(categoryRepository.findByName("Alimentação Atualizada")).thenReturn(Optional.empty());

            var result = categoryService.update(command);

            assertThat(result.getName()).isEqualTo("Alimentação Atualizada");
            verify(categoryRepository).update(1L, "Alimentação Atualizada", CategoryType.EXPENSE, true);
        }

        @Test
        @DisplayName("deve permitir atualizar para o mesmo nome")
        void shouldAllowUpdatingToSameName() {
            var command = new UpdateCategoryCommand(1L, "Alimentação", CategoryType.INCOME, true);
            var existing = createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, true);
            var updated = createTestCategory(1L, "Alimentação", CategoryType.INCOME, true);

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing), Optional.of(updated));
            when(categoryRepository.findByName("Alimentação")).thenReturn(Optional.of(existing));

            var result = categoryService.update(command);

            assertThat(result.getType()).isEqualTo(CategoryType.INCOME);
            verify(categoryRepository).update(1L, "Alimentação", CategoryType.INCOME, true);
        }

        @Test
        @DisplayName("deve lançar exceção quando categoria não existe")
        void shouldThrowWhenCategoryNotFound() {
            var command = new UpdateCategoryCommand(1L, "Alimentação", CategoryType.EXPENSE, true);

            when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.update(command))
                    .isInstanceOf(CategoryNotFoundException.class);

            verify(categoryRepository, never()).update(anyLong(), anyString(), any(), anyBoolean());
        }

        @Test
        @DisplayName("deve lançar exceção quando nome é nulo")
        void shouldThrowWhenNameIsNull() {
            var command = new UpdateCategoryCommand(1L, null, CategoryType.EXPENSE, true);

            assertThatThrownBy(() -> categoryService.update(command))
                    .isInstanceOf(InvalidCategoryException.class)
                    .hasMessage("Nome da categoria é obrigatório");

            verify(categoryRepository, never()).update(anyLong(), anyString(), any(), anyBoolean());
        }

        @Test
        @DisplayName("deve lançar exceção quando tipo é nulo")
        void shouldThrowWhenTypeIsNull() {
            var command = new UpdateCategoryCommand(1L, "Alimentação", null, true);

            assertThatThrownBy(() -> categoryService.update(command))
                    .isInstanceOf(InvalidCategoryException.class)
                    .hasMessage("Tipo da categoria é obrigatório");

            verify(categoryRepository, never()).update(anyLong(), anyString(), any(), anyBoolean());
        }

        @Test
        @DisplayName("deve lançar exceção quando nome já existe em outra categoria")
        void shouldThrowWhenNameExistsInAnotherCategory() {
            var command = new UpdateCategoryCommand(1L, "Salário", CategoryType.EXPENSE, true);
            var existing = createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, true);
            var another = createTestCategory(2L, "Salário", CategoryType.INCOME, true);

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(categoryRepository.findByName("Salário")).thenReturn(Optional.of(another));

            assertThatThrownBy(() -> categoryService.update(command))
                    .isInstanceOf(DuplicateCategoryNameException.class);

            verify(categoryRepository, never()).update(anyLong(), anyString(), any(), anyBoolean());
        }
    }

    @Nested
    @DisplayName("deactivate")
    class DeactivateTests {

        @Test
        @DisplayName("deve desativar categoria com sucesso")
        void shouldDeactivateCategorySuccessfully() {
            var category = createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, true);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

            categoryService.deactivate(1L);

            verify(categoryRepository).setActive(1L, false);
        }

        @Test
        @DisplayName("deve lançar exceção quando categoria não existe")
        void shouldThrowWhenCategoryNotFound() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.deactivate(1L))
                    .isInstanceOf(CategoryNotFoundException.class);

            verify(categoryRepository, never()).setActive(anyLong(), anyBoolean());
        }
    }

    @Nested
    @DisplayName("activate")
    class ActivateTests {

        @Test
        @DisplayName("deve ativar categoria com sucesso")
        void shouldActivateCategorySuccessfully() {
            var category = createTestCategory(1L, "Alimentação", CategoryType.EXPENSE, false);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

            categoryService.activate(1L);

            verify(categoryRepository).setActive(1L, true);
        }

        @Test
        @DisplayName("deve lançar exceção quando categoria não existe")
        void shouldThrowWhenCategoryNotFound() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.activate(1L))
                    .isInstanceOf(CategoryNotFoundException.class);

            verify(categoryRepository, never()).setActive(anyLong(), anyBoolean());
        }
    }
}
