package com.piblogchain.backend.controllers;

import com.piblogchain.backend.dto.CategoryDTO;
import com.piblogchain.backend.models.Category;
import com.piblogchain.backend.services.CategoryService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@SecurityRequirement(name = "BearerAuth")
public class CategoryController {

  private final CategoryService categoryService;

  @Autowired
  public CategoryController(CategoryService categoryService) {
    this.categoryService = categoryService;
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public ResponseEntity<Category> createCategory(@RequestBody @Valid CategoryDTO dto) {
    Category created = categoryService.createCategory(dto);
    return ResponseEntity.ok(created);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PutMapping("/{id}")
  public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody @Valid CategoryDTO dto) {
    return categoryService.updateCategory(id, dto)
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());
  }

  @PreAuthorize("hasRole('ADMIN')")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
    categoryService.deleteCategory(id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping
  public ResponseEntity<List<Category>> getAllCategories() {
    return ResponseEntity.ok(categoryService.getAllCategories());
  }

  @GetMapping("/slug/{slug}")
  public ResponseEntity<Category> getCategoryBySlug(@PathVariable String slug) {
    return categoryService.getCategoryBySlug(slug)
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());
  }

}
