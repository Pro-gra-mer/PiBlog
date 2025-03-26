package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.CategoryDTO;
import com.piblogchain.backend.models.Category;
import com.piblogchain.backend.repositories.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

  private final CategoryRepository categoryRepository;

  @Autowired
  public CategoryService(CategoryRepository categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  public Category createCategory(CategoryDTO dto) {
    if (categoryRepository.existsByName(dto.getName())) {
      throw new IllegalArgumentException("Category with name already exists");
    }
    return categoryRepository.save(new Category(dto.getName()));
  }

  public List<Category> getAllCategories() {
    return categoryRepository.findAll();
  }

  public Optional<Category> getCategoryById(Long id) {
    return categoryRepository.findById(id);
  }

  public Optional<Category> updateCategory(Long id, CategoryDTO dto) {
    return categoryRepository.findById(id).map(category -> {
      category.setName(dto.getName());
      return categoryRepository.save(category);
    });
  }

  public boolean deleteCategory(Long id) {
    if (categoryRepository.existsById(id)) {
      categoryRepository.deleteById(id);
      return true;
    }
    return false;
  }
}
