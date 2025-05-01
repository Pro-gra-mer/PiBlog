package com.piblogchain.backend.repositories;

import com.piblogchain.backend.models.ArticlePromotion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArticlePromotionRepository extends JpaRepository<ArticlePromotion, Long> {

  List<ArticlePromotion> findByArticleId(Long articleId);
}
