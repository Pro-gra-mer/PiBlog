package com.piblogchain.backend.repositories;

import com.piblogchain.backend.models.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, Long> {

  // Méttodo para obtener artículos no aprobados con imagen y cuya fecha de carga sea anterior a cutoff
  List<Article> findByApprovedFalseAndHeaderImagePublicIdIsNotNullAndHeaderImageUploadDateBefore(LocalDateTime cutoff);
}
