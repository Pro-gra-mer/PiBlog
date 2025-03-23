package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.ArticleDTO;
import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.repositories.ArticleRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
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
    // la cual debe tener el formato: cloudinary://<api_key>:<api_secret>@<cloud_name>
    this.cloudinary = new Cloudinary(cloudinaryUrl);
  }

  /**
   * Crea un nuevo artículo a partir de un DTO.
   * Se valida que el total de imágenes (cabecera + contenido) no supere 5.
   * El campo 'approved' se establece en false para indicar que el artículo está pendiente de aprobación.
   */
  public Article createArticle(ArticleDTO articleDTO) {
    validateImageCount(articleDTO);
    Article article = buildArticleFromDto(articleDTO);
    return articleRepository.save(article);
  }

  private void validateImageCount(ArticleDTO articleDTO) {
    int imageCount = 0;
    // Contar imagen de cabecera si existe
    if (articleDTO.getHeaderImage() != null && !articleDTO.getHeaderImage().isEmpty()) {
      imageCount++;
    }
    // Analizar el contenido HTML para contar las etiquetas <img>
    Document doc = Jsoup.parse(articleDTO.getContent());
    Elements imgElements = doc.select("img");
    imageCount += imgElements.size();

    if (imageCount > 5) {
      throw new IllegalArgumentException("El artículo no puede contener más de 5 imágenes en total.");
    }
  }

  private Article buildArticleFromDto(ArticleDTO articleDTO) {
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
    article.setStatus(ArticleStatus.DRAFT);

    return article;
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
      article.setStatus(ArticleStatus.PUBLISHED);
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

  /**
   * Envía un artículo a revisión (cambia su estado de DRAFT a PENDING_APPROVAL).
   */
  public Optional<Article> submitArticleForReview(Long id) {
    Optional<Article> articleOpt = articleRepository.findById(id);
    if (articleOpt.isPresent()) {
      Article article = articleOpt.get();
      if (article.getStatus() == ArticleStatus.DRAFT) {
        article.setStatus(ArticleStatus.PENDING_APPROVAL);
        Article updated = articleRepository.save(article);
        return Optional.of(updated);
      }
    }
    return Optional.empty();
  }

  /**
   * Obtiene todos los artículos con un estado específico (DRAFT, PENDING_APPROVAL, PUBLISHED).
   */
  public List<Article> getArticlesByStatus(ArticleStatus status) {
    return articleRepository.findByStatus(status);
  }


  public Optional<Article> updateArticle(Long id, ArticleDTO articleDTO) {
    return articleRepository.findById(id).map(article -> {
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


      // ✅ Aquí respetas el estado enviado desde el frontend
      article.setStatus(articleDTO.getStatus());

      // (opcional) Log de depuración
      System.out.println("Actualizando artículo ID " + id + " con estado: " + articleDTO.getStatus());

      return articleRepository.save(article);
    });
  }



}
