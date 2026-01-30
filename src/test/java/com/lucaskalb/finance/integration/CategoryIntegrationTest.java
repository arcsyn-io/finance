package com.lucaskalb.finance.integration;

import com.lucaskalb.finance.dto.CreateCategoryCommand;
import com.lucaskalb.finance.dto.UpdateCategoryCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.DuplicateCategoryNameException;
import com.lucaskalb.finance.exception.InvalidCategoryException;
import com.lucaskalb.finance.model.CategoryType;
import com.lucaskalb.finance.service.CategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CategoryIntegrationTest {

    @Autowired
    private CategoryService categoryService;

    @Nested
    @DisplayName("Fluxo de criação")
    class CreateFlowTests {

        @Test
        @DisplayName("deve criar categoria e persistir no banco")
        void shouldCreateAndPersistCategory() {
            var command = new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE);

            var created = categoryService.create(command);

            assertThat(created.getId()).isNotNull();
            assertThat(created.getName()).isEqualTo("Alimentação");
            assertThat(created.getType()).isEqualTo(CategoryType.EXPENSE);
            assertThat(created.isActive()).isTrue();
            assertThat(created.getCreatedAt()).isNotNull();

            var found = categoryService.findById(created.getId());
            assertThat(found.getName()).isEqualTo("Alimentação");
        }

        @Test
        @DisplayName("deve criar múltiplas categorias com nomes diferentes")
        void shouldCreateMultipleCategoriesWithDifferentNames() {
            categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));
            categoryService.create(new CreateCategoryCommand("Transporte", CategoryType.EXPENSE));
            categoryService.create(new CreateCategoryCommand("Salário", CategoryType.INCOME));

            var categories = categoryService.listActive();

            assertThat(categories).hasSizeGreaterThanOrEqualTo(3);
            assertThat(categories).extracting("name")
                    .contains("Alimentação", "Transporte", "Salário");
        }

        @Test
        @DisplayName("deve rejeitar criação com nome duplicado")
        void shouldRejectDuplicateName() {
            categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));

            assertThatThrownBy(() ->
                    categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.INCOME)))
                    .isInstanceOf(DuplicateCategoryNameException.class);
        }

        @Test
        @DisplayName("deve rejeitar criação com nome duplicado case-insensitive")
        void shouldRejectDuplicateNameCaseInsensitive() {
            categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));

            assertThatThrownBy(() ->
                    categoryService.create(new CreateCategoryCommand("ALIMENTAÇÃO", CategoryType.EXPENSE)))
                    .isInstanceOf(DuplicateCategoryNameException.class);
        }

        @Test
        @DisplayName("deve rejeitar criação com nome vazio")
        void shouldRejectEmptyName() {
            assertThatThrownBy(() ->
                    categoryService.create(new CreateCategoryCommand("", CategoryType.EXPENSE)))
                    .isInstanceOf(InvalidCategoryException.class)
                    .hasMessage("Nome da categoria é obrigatório");
        }

        @Test
        @DisplayName("deve rejeitar criação com tipo nulo")
        void shouldRejectNullType() {
            assertThatThrownBy(() ->
                    categoryService.create(new CreateCategoryCommand("Alimentação", null)))
                    .isInstanceOf(InvalidCategoryException.class)
                    .hasMessage("Tipo da categoria é obrigatório");
        }
    }

    @Nested
    @DisplayName("Fluxo de atualização")
    class UpdateFlowTests {

        @Test
        @DisplayName("deve atualizar categoria e persistir alterações")
        void shouldUpdateAndPersistCategory() {
            var created = categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));

            var command = new UpdateCategoryCommand(created.getId(), "Comida", CategoryType.EXPENSE, true);
            var updated = categoryService.update(command);

            assertThat(updated.getName()).isEqualTo("Comida");

            var found = categoryService.findById(created.getId());
            assertThat(found.getName()).isEqualTo("Comida");
        }

        @Test
        @DisplayName("deve atualizar tipo da categoria")
        void shouldUpdateCategoryType() {
            var created = categoryService.create(new CreateCategoryCommand("Bônus", CategoryType.EXPENSE));

            var command = new UpdateCategoryCommand(created.getId(), "Bônus", CategoryType.INCOME, true);
            var updated = categoryService.update(command);

            assertThat(updated.getType()).isEqualTo(CategoryType.INCOME);
        }

        @Test
        @DisplayName("deve permitir manter o mesmo nome na atualização")
        void shouldAllowSameNameOnUpdate() {
            var created = categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));

            var command = new UpdateCategoryCommand(created.getId(), "Alimentação", CategoryType.INCOME, true);
            var updated = categoryService.update(command);

            assertThat(updated.getName()).isEqualTo("Alimentação");
            assertThat(updated.getType()).isEqualTo(CategoryType.INCOME);
        }

        @Test
        @DisplayName("deve rejeitar atualização para nome já existente em outra categoria")
        void shouldRejectUpdateToExistingName() {
            var cat1 = categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));
            var cat2 = categoryService.create(new CreateCategoryCommand("Transporte", CategoryType.EXPENSE));

            var command = new UpdateCategoryCommand(cat2.getId(), "Alimentação", CategoryType.EXPENSE, true);

            assertThatThrownBy(() -> categoryService.update(command))
                    .isInstanceOf(DuplicateCategoryNameException.class);
        }

        @Test
        @DisplayName("deve rejeitar atualização de categoria inexistente")
        void shouldRejectUpdateOfNonExistentCategory() {
            var command = new UpdateCategoryCommand(99999L, "Teste", CategoryType.EXPENSE, true);

            assertThatThrownBy(() -> categoryService.update(command))
                    .isInstanceOf(CategoryNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Fluxo de listagem")
    class ListFlowTests {

        @Test
        @DisplayName("deve listar apenas categorias ativas")
        void shouldListOnlyActiveCategories() {
            var cat1 = categoryService.create(new CreateCategoryCommand("Ativa1", CategoryType.EXPENSE));
            var cat2 = categoryService.create(new CreateCategoryCommand("Ativa2", CategoryType.INCOME));
            var cat3 = categoryService.create(new CreateCategoryCommand("Inativa", CategoryType.EXPENSE));
            categoryService.deactivate(cat3.getId());

            var activeCategories = categoryService.listActive();

            assertThat(activeCategories).extracting("name")
                    .contains("Ativa1", "Ativa2")
                    .doesNotContain("Inativa");
        }

        @Test
        @DisplayName("deve listar todas as categorias incluindo inativas")
        void shouldListAllCategoriesIncludingInactive() {
            var cat1 = categoryService.create(new CreateCategoryCommand("Ativa", CategoryType.EXPENSE));
            var cat2 = categoryService.create(new CreateCategoryCommand("Inativa", CategoryType.EXPENSE));
            categoryService.deactivate(cat2.getId());

            var allCategories = categoryService.listAll();

            assertThat(allCategories).extracting("name")
                    .contains("Ativa", "Inativa");
        }

        @Test
        @DisplayName("deve ordenar categorias por nome")
        void shouldOrderCategoriesByName() {
            categoryService.create(new CreateCategoryCommand("Zebra", CategoryType.EXPENSE));
            categoryService.create(new CreateCategoryCommand("Alfa", CategoryType.EXPENSE));
            categoryService.create(new CreateCategoryCommand("Beta", CategoryType.EXPENSE));

            var categories = categoryService.listActive();

            var names = categories.stream()
                    .map(c -> c.getName())
                    .filter(n -> n.equals("Alfa") || n.equals("Beta") || n.equals("Zebra"))
                    .toList();

            assertThat(names).containsExactly("Alfa", "Beta", "Zebra");
        }
    }

    @Nested
    @DisplayName("Fluxo de ativação/desativação")
    class ActivationFlowTests {

        @Test
        @DisplayName("deve desativar categoria")
        void shouldDeactivateCategory() {
            var created = categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));

            categoryService.deactivate(created.getId());

            var found = categoryService.findById(created.getId());
            assertThat(found.isActive()).isFalse();
        }

        @Test
        @DisplayName("deve reativar categoria")
        void shouldReactivateCategory() {
            var created = categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));
            categoryService.deactivate(created.getId());

            categoryService.activate(created.getId());

            var found = categoryService.findById(created.getId());
            assertThat(found.isActive()).isTrue();
        }

        @Test
        @DisplayName("deve manter categoria inativa ao atualizar sem flag active")
        void shouldKeepInactiveWhenUpdatingWithoutActiveFlag() {
            var created = categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));
            categoryService.deactivate(created.getId());

            var command = new UpdateCategoryCommand(created.getId(), "Comida", CategoryType.EXPENSE, false);
            categoryService.update(command);

            var found = categoryService.findById(created.getId());
            assertThat(found.isActive()).isFalse();
            assertThat(found.getName()).isEqualTo("Comida");
        }

        @Test
        @DisplayName("deve reativar via update com active=true")
        void shouldReactivateViaUpdateWithActiveTrue() {
            var created = categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));
            categoryService.deactivate(created.getId());

            var command = new UpdateCategoryCommand(created.getId(), "Alimentação", CategoryType.EXPENSE, true);
            categoryService.update(command);

            var found = categoryService.findById(created.getId());
            assertThat(found.isActive()).isTrue();
        }

        @Test
        @DisplayName("deve rejeitar desativação de categoria inexistente")
        void shouldRejectDeactivationOfNonExistentCategory() {
            assertThatThrownBy(() -> categoryService.deactivate(99999L))
                    .isInstanceOf(CategoryNotFoundException.class);
        }

        @Test
        @DisplayName("deve rejeitar ativação de categoria inexistente")
        void shouldRejectActivationOfNonExistentCategory() {
            assertThatThrownBy(() -> categoryService.activate(99999L))
                    .isInstanceOf(CategoryNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Fluxo de busca por ID")
    class FindByIdFlowTests {

        @Test
        @DisplayName("deve encontrar categoria por ID")
        void shouldFindCategoryById() {
            var created = categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));

            var found = categoryService.findById(created.getId());

            assertThat(found).isNotNull();
            assertThat(found.getId()).isEqualTo(created.getId());
            assertThat(found.getName()).isEqualTo("Alimentação");
        }

        @Test
        @DisplayName("deve lançar exceção quando categoria não existe")
        void shouldThrowWhenCategoryNotFound() {
            assertThatThrownBy(() -> categoryService.findById(99999L))
                    .isInstanceOf(CategoryNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Fluxo completo CRUD")
    class FullCrudFlowTests {

        @Test
        @DisplayName("deve executar fluxo completo de CRUD")
        void shouldExecuteFullCrudFlow() {
            // Create
            var created = categoryService.create(new CreateCategoryCommand("Alimentação", CategoryType.EXPENSE));
            assertThat(created.getId()).isNotNull();

            // Read
            var found = categoryService.findById(created.getId());
            assertThat(found.getName()).isEqualTo("Alimentação");

            // Update
            var updateCommand = new UpdateCategoryCommand(created.getId(), "Comida", CategoryType.EXPENSE, true);
            var updated = categoryService.update(updateCommand);
            assertThat(updated.getName()).isEqualTo("Comida");

            // Verify update persisted
            var afterUpdate = categoryService.findById(created.getId());
            assertThat(afterUpdate.getName()).isEqualTo("Comida");

            // Deactivate (soft delete)
            categoryService.deactivate(created.getId());

            // Verify not in active list
            var activeList = categoryService.listActive();
            assertThat(activeList).extracting("id")
                    .doesNotContain(created.getId());

            // Verify still in all list
            var allList = categoryService.listAll();
            assertThat(allList).extracting("id")
                    .contains(created.getId());

            // Reactivate
            categoryService.activate(created.getId());

            // Verify back in active list
            var reactivatedList = categoryService.listActive();
            assertThat(reactivatedList).extracting("id")
                    .contains(created.getId());
        }
    }
}
