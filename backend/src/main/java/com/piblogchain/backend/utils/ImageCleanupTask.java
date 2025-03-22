package com.piblogchain.backend.utils;

import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.repositories.ArticleRepository;
import com.piblogchain.backend.services.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ImageCleanupTask {

  private final ArticleRepository articleRepository;
  private final ArticleService articleService;

  @Autowired
  public ImageCleanupTask(ArticleRepository articleRepository, ArticleService articleService) {
    this.articleRepository = articleRepository;
    this.articleService = articleService;
  }

  /**
   * Esta tarea se ejecuta cada hora y limpia las imágenes huérfanas de artículos no aprobados
   * cuya fecha de carga sea anterior a 48 horas.
   */
  @Scheduled(cron = "0 * * * * *") // Se ejecuta al inicio de cada minuto
  public void cleanupOrphanImages() {
    LocalDateTime cutoff = LocalDateTime.now().minusHours(48);
    List<Article> articles = articleRepository.findByApprovedFalseAndHeaderImagePublicIdIsNotNullAndHeaderImageUploadDateBefore(cutoff);
    for (Article article : articles) {
      String publicId = article.getHeaderImagePublicId();
      if (publicId != null && !publicId.isEmpty()) {
        boolean result = articleService.deleteOrphanImage(publicId);
        if (result) {
          // Opcional: actualizar el artículo para eliminar los metadatos de la imagen
          article.setHeaderImage(null);
          article.setHeaderImagePublicId(null);
          article.setHeaderImageUploadDate(null);
          articleRepository.save(article);
        }
      }
    }
  }
}
