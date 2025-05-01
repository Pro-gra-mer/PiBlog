package com.piblogchain.backend.repositories;

import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.models.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, Long> {

  List<Article> findByStatus(ArticleStatus status);

  List<Article> findByStatusAndCreatedBy(ArticleStatus status, String createdBy);

  List<Article> findByCategorySlugIgnoreCaseAndStatus(String slug, ArticleStatus status);

}
