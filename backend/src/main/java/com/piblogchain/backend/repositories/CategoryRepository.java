package com.piblogchain.backend.repositories;

import com.piblogchain.backend.models.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
  Optional<Category> findByName(String name);
  Optional<Category> findBySlug(String slug); // Añadido
  boolean existsByName(String name);
}
