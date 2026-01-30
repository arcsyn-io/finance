package com.lucaskalb.finance.service;

import com.lucaskalb.finance.dto.CreateCategoryCommand;
import com.lucaskalb.finance.dto.UpdateCategoryCommand;
import com.lucaskalb.finance.exception.CategoryNotFoundException;
import com.lucaskalb.finance.exception.DuplicateCategoryNameException;
import com.lucaskalb.finance.exception.InvalidCategoryException;
import com.lucaskalb.finance.model.Category;
import com.lucaskalb.finance.model.CategoryType;
import com.lucaskalb.finance.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<Category> listActive() {
        return categoryRepository.listAll(false);
    }

    @Transactional(readOnly = true)
    public List<Category> listAll() {
        return categoryRepository.listAll(true);
    }

    @Transactional(readOnly = true)
    public Category findById(long id) {
        return categoryRepository.findById(id)
                .orElseThrow(CategoryNotFoundException::new);
    }

    @Transactional
    public Category create(CreateCategoryCommand command) {
        var normalizedName = validateAndNormalizeName(command.name());
        validateType(command.type());

        if (categoryRepository.findByName(normalizedName).isPresent()) {
            throw new DuplicateCategoryNameException();
        }

        var id = categoryRepository.insert(normalizedName, command.type());
        return categoryRepository.findById(id).orElseThrow();
    }

    @Transactional
    public Category update(UpdateCategoryCommand command) {
        var normalizedName = validateAndNormalizeName(command.name());
        validateType(command.type());

        var existing = categoryRepository.findById(command.id())
                .orElseThrow(CategoryNotFoundException::new);

        var duplicate = categoryRepository.findByName(normalizedName);
        if (duplicate.isPresent() && !duplicate.get().getId().equals(command.id())) {
            throw new DuplicateCategoryNameException();
        }

        categoryRepository.update(command.id(), normalizedName, command.type(), command.active());
        return categoryRepository.findById(command.id()).orElseThrow();
    }

    @Transactional
    public void deactivate(long id) {
        categoryRepository.findById(id)
                .orElseThrow(CategoryNotFoundException::new);

        categoryRepository.setActive(id, false);
    }

    @Transactional
    public void activate(long id) {
        categoryRepository.findById(id)
                .orElseThrow(CategoryNotFoundException::new);

        categoryRepository.setActive(id, true);
    }

    private String validateAndNormalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new InvalidCategoryException("Nome da categoria é obrigatório");
        }
        return name.trim();
    }

    private void validateType(CategoryType type) {
        if (type == null) {
            throw new InvalidCategoryException("Tipo da categoria é obrigatório");
        }
    }
}
