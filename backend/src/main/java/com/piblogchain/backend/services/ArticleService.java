package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.ArticleDTO;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.repositories.ArticleRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ArticleService {

  private final ArticleRepository articleRepository;
  private final Cloudinary cloudinary;

  @Autowired
  public ArticleService(ArticleRepository articleRepository, @Value("${cloudinary.url}") String cloudinaryUrl) {
    this.articleRepository = articleRepository;
    // Se inicializa Cloudinary utilizando la URL configurada en el entorno,
    // la cual debe tener el formato:
    // cloudinary://<api_key>:<api_secret>@<cloud_name>
    this.cloudinary = new Cloudinary(cloudinaryUrl);
  }

  /**
   * Crea un nuevo artículo a partir de un DTO.
   * El campo 'approved' se establece en false para indicar que el artículo
   * está pendiente de aprobación.
   */
  public Article createArticle(ArticleDTO articleDTO) {
    Article article = new Article();
    article.setCompany(articleDTO.getCompany());
    article.setApp(articleDTO.getApp());
    article.setTitle(articleDTO.getTitle());
    article.setDescription(articleDTO.getDescription());
    article.setHeaderImage(articleDTO.getHeaderImage());
    article.setHeaderImagePublicId(articleDTO.getHeaderImagePublicId());
    article.setHeaderImageUploadDate(articleDTO.getHeaderImageUploadDate());
    article.setCategory(articleDTO.getCategory());
    article.setContent(articleDTO.getContent());
    article.setPublishDate(articleDTO.getPublishDate());
    article.setPromoteVideo(articleDTO.isPromoteVideo());
    article.setApproved(false); // El artículo se crea sin aprobación.

    return articleRepository.save(article);
  }

  /**
   * Retorna la lista de todos los artículos.
   */
  public List<Article> getAllArticles() {
    return articleRepository.findAll();
  }

  /**
   * Retorna un artículo a partir de su ID.
   */
  public Optional<Article> getArticleById(Long id) {
    return articleRepository.findById(id);
  }

  /**
   * Aprueba un artículo (actualiza el campo approved a true).
   */
  public Optional<Article> approveArticle(Long id) {
    Optional<Article> articleOpt = articleRepository.findById(id);
    if (articleOpt.isPresent()) {
      Article article = articleOpt.get();
      article.setApproved(true);
      Article updatedArticle = articleRepository.save(article);
      return Optional.of(updatedArticle);
    }
    return Optional.empty();
  }

  /**
   * Elimina un artículo a partir de su ID.
   * Retorna true si la eliminación fue exitosa, o false si no se encontró el artículo.
   */
  public boolean deleteArticle(Long id) {
    if (articleRepository.existsById(id)) {
      articleRepository.deleteById(id);
      return true;
    }
    return false;
  }

  /**
   * Elimina una imagen en Cloudinary usando su publicId.
   * Se utiliza para limpiar imágenes huérfanas.
   */
  public boolean deleteOrphanImage(String publicId) {
    try {
      @SuppressWarnings("unchecked")
      Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
      return "ok".equals(result.get("result"));
    } catch (Exception e) {
      e.printStackTrace();
      return false;
    }
  }
}
