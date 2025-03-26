package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.ArticleDTO;
import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.models.User;
import com.piblogchain.backend.models.UserRole;
import com.piblogchain.backend.repositories.ArticleRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.piblogchain.backend.repositories.UserRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
    this.cloudinary = new Cloudinary(cloudinaryUrl);
  }

  @Autowired
  private UserRepository userRepository;

  public Article createArticle(ArticleDTO articleDTO, String username) {
    validateImageCount(articleDTO);

    User user = userRepository.findByUsername(username)
      .orElseThrow(() -> new RuntimeException("User not found: " + username));

    Article article = buildArticleFromDto(articleDTO);

    if (user.getRole() == UserRole.USER) {
      if (articleDTO.getStatus() == ArticleStatus.PUBLISHED) {
        throw new IllegalArgumentException("Users cannot publish articles directly.");
      }
      article.setStatus(articleDTO.getStatus() != null ? articleDTO.getStatus() : ArticleStatus.DRAFT);
    } else {
      article.setStatus(articleDTO.getStatus() != null ? articleDTO.getStatus() : ArticleStatus.DRAFT);
    }

    article.setCreatedBy(username);

    return articleRepository.save(article);
  }

  private void validateImageCount(ArticleDTO articleDTO) {
    int imageCount = 0;
    if (articleDTO.getHeaderImage() != null && !articleDTO.getHeaderImage().isEmpty()) {
      imageCount++;
    }
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
    article.setPromoVideo(articleDTO.getPromoVideo());
    article.setPromoVideoPublicId(articleDTO.getPromoVideoPublicId());
    article.setPromoVideoUploadDate(articleDTO.getPromoVideoUploadDate());
    article.setStatus(articleDTO.getStatus() != null ? articleDTO.getStatus() : ArticleStatus.DRAFT);
    return article;
  }

  public List<Article> getAllArticles() {
    return articleRepository.findAll();
  }

  public Optional<Article> getArticleById(Long id) {
    return articleRepository.findById(id);
  }

  public Optional<Article> approveArticle(Long id) {
    Optional<Article> articleOpt = articleRepository.findById(id);
    if (articleOpt.isPresent()) {
      Article article = articleOpt.get();

      if (article.getStatus() != ArticleStatus.PENDING_APPROVAL) {
        throw new IllegalStateException("Only pending articles can be approved.");
      }

      article.setStatus(ArticleStatus.PUBLISHED);
      article.setPublishDate(LocalDate.now());

      Article updatedArticle = articleRepository.save(article);
      return Optional.of(updatedArticle);
    }
    return Optional.empty();
  }

  public boolean deleteArticle(Long id) {
    if (articleRepository.existsById(id)) {
      articleRepository.deleteById(id);
      return true;
    }
    return false;
  }

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
      article.setPromoVideo(articleDTO.getPromoVideo());
      article.setPromoVideoPublicId(articleDTO.getPromoVideoPublicId());
      article.setPromoVideoUploadDate(articleDTO.getPromoVideoUploadDate());
      article.setStatus(articleDTO.getStatus());

      System.out.println("Actualizando artículo ID " + id + " con estado: " + articleDTO.getStatus());

      return articleRepository.save(article);
    });
  }

  public List<Article> getDraftsByUser(String username) {
    return articleRepository.findByStatusAndCreatedBy(ArticleStatus.DRAFT, username);
  }

  public List<Article> getPublishedArticlesByUser(String username) {
    return articleRepository.findByStatusAndCreatedBy(ArticleStatus.PUBLISHED, username);
  }

  public List<Article> getPendingArticlesByUser(String username) {
    return articleRepository.findByStatusAndCreatedBy(ArticleStatus.PENDING_APPROVAL, username);
  }

  public boolean deleteOrphanVideo(String publicId) {
    try {
      @SuppressWarnings("unchecked")
      Map<String, Object> result = cloudinary.uploader().destroy(
        publicId,
        Map.of("resource_type", "video")
      );
      return "ok".equals(result.get("result"));
    } catch (Exception e) {
      e.printStackTrace();
      return false;
    }
  }
}
