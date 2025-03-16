package com.piblogchain.backend.repositories;

import com.piblogchain.backend.models.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
  // Puedes agregar métodos de consulta personalizados aquí si lo necesitas.
}
