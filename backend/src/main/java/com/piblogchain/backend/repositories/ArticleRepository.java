package com.piblogchain.backend.repositories;

import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.enums.PromoteType;
import com.piblogchain.backend.models.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, Long> {

  List<Article> findByStatus(ArticleStatus status);

  List<Article> findByStatusAndCreatedBy(ArticleStatus status, String createdBy);

  List<Article> findByCategorySlugIgnoreCaseAndStatus(String slug, ArticleStatus status);

  List<Article> findByPromoteType(PromoteType promoteType); // Opcional

  List<Article> findByPromoteTypeAndStatus(PromoteType promoteType, ArticleStatus status);

  // ✅ Este es el correcto para videos promocionados por categoría usando slug
  List<Article> findByPromoteTypeAndCategory_SlugIgnoreCaseAndStatus(
    PromoteType type,
    String slug,
    ArticleStatus status
  );
}
