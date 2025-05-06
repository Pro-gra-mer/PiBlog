package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.CategoryDTO;
import com.piblogchain.backend.models.Category;
import com.piblogchain.backend.repositories.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

  private static final Logger log = LoggerFactory.getLogger(CategoryService.class);

  private final CategoryRepository categoryRepository;
  private final boolean isProduction;

  public CategoryService(
    CategoryRepository categoryRepository,
    @Value("${app.production:false}") boolean isProduction
  ) {
    this.categoryRepository = categoryRepository;
    this.isProduction = isProduction;
  }

  // Creates a new category
  public Category createCategory(CategoryDTO dto) {
    try {
      if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty()) {
        throw new IllegalArgumentException("Category name is required");
      }
      if (categoryRepository.existsByName(dto.getName())) {
        throw new IllegalArgumentException("Category with name already exists");
      }
      if (dto.getSlug() == null || dto.getSlug().trim().isEmpty()) {
        throw new IllegalArgumentException("Slug is required");
      }
      // Usar constructor con name y slug
      Category category = new Category(dto.getName(), dto.getSlug());
      category.setDescription(dto.getDescription());
      category.setEmoji(dto.getEmoji());
      category.setHeaderImage(dto.getHeaderImage());

      Category savedCategory = categoryRepository.save(category);
      if (!isProduction) {
        log.info("Category created with name: {}, slug: {}", dto.getName(), dto.getSlug());
      }
      return savedCategory;
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to create category: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to create category");
    }
  }

  // Retrieves all categories
  public List<Category> getAllCategories() {
    try {
      return categoryRepository.findAll();
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to retrieve categories: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve categories");
    }
  }

  // Retrieves a category by ID
  public Optional<Category> getCategoryById(Long id) {
    try {
      if (id == null) {
        throw new IllegalArgumentException("Category ID is required");
      }
      return categoryRepository.findById(id);
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to retrieve category with ID: {}", id);
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to retrieve category");
    }
  }

  // Updates an existing category
  public Optional<Category> updateCategory(Long id, CategoryDTO dto) {
    try {
      if (id == null) {
        throw new IllegalArgumentException("Category ID is required");
      }
      if (dto == null || dto.getName() == null || dto.getName().trim().isEmpty()) {
        throw new IllegalArgumentException("Category name is required");
      }
      if (dto.getSlug() == null || dto.getSlug().trim().isEmpty()) {
        throw new IllegalArgumentException("Slug is required");
      }

      // Verifica duplicado por nombre (evitando conflicto con el mismo ID)
      boolean nameExists = categoryRepository.existsByName(dto.getName());
      boolean isSameName = categoryRepository.findById(id)
        .map(c -> c.getName().equals(dto.getName()))
        .orElse(false);

      if (nameExists && !isSameName) {
        throw new IllegalArgumentException("Category with name already exists");
      }

      return categoryRepository.findById(id).map(category -> {
        category.setName(dto.getName());
        category.setSlug(dto.getSlug()); // Usar el slug del DTO
        category.setDescription(dto.getDescription());
        category.setEmoji(dto.getEmoji());
        category.setHeaderImage(dto.getHeaderImage());

        Category updatedCategory = categoryRepository.save(category);

        if (!isProduction) {
          log.info("Category updated with ID: {}, slug: {}", id, dto.getSlug());
        }
        return updatedCategory;
      });
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to update category with ID: {}", id, e);
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to update category");
    }
  }


  // Deletes a category by ID
  public boolean deleteCategory(Long id) {
    try {
      if (id == null) {
        throw new IllegalArgumentException("Category ID is required");
      }
      if (categoryRepository.existsById(id)) {
        categoryRepository.deleteById(id);
        if (!isProduction) {
          log.info("Category deleted with ID: {}", id);
        }
        return true;
      }
      return false;
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to delete category with ID: {}", id);
      }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete category");
    }
  }

  public Optional<Category> getCategoryBySlug(String slug) {
    return categoryRepository.findBySlug(slug);
  }

}
