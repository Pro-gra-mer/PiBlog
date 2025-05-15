package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.ActivePlanDTO;
import com.piblogchain.backend.dto.ArticleDTO;
import com.piblogchain.backend.dto.CategoryDTO;
import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.enums.PaymentStatus;
import com.piblogchain.backend.enums.PromoteType;
import com.piblogchain.backend.models.*;
import com.piblogchain.backend.repositories.ArticleRepository;
import com.piblogchain.backend.repositories.CategoryRepository;
import com.piblogchain.backend.repositories.UserRepository;
import com.piblogchain.backend.repositories.PaymentRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.transaction.Transactional;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ArticleService {

  private static final Logger log = LoggerFactory.getLogger(ArticleService.class);

  private final ArticleRepository articleRepository;
  private final CategoryRepository categoryRepository;
  private final UserRepository userRepository;
  private final Cloudinary cloudinary;
  private final PaymentRepository paymentRepository;
  private final PaymentService paymentService;
  private final boolean isProduction;

  @Autowired
  public ArticleService(
    ArticleRepository articleRepository,
    CategoryRepository categoryRepository,
    UserRepository userRepository,
    PaymentRepository paymentRepository,
    PaymentService paymentService,
    @Value("${cloudinary.url}") String cloudinaryUrl,
    @Value("${app.production:false}") boolean isProduction
  ) {
    this.articleRepository = articleRepository;
    this.categoryRepository = categoryRepository;
    this.userRepository = userRepository;
    this.paymentRepository = paymentRepository;
    this.paymentService = paymentService;
    this.cloudinary = new Cloudinary(cloudinaryUrl);
    this.isProduction = isProduction;
  }

  // Creates a new article
  public Article createArticle(ArticleDTO articleDTO, String username) {
    try {
      validateImageCount(articleDTO);
      if (articleDTO.getCategory() == null || articleDTO.getCategory().getName() == null) {
        throw new IllegalArgumentException("Category name is required");
      }
      User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
      Article article = buildArticleFromDto(articleDTO);

      if (user.getRole() == UserRole.USER) {
        if (articleDTO.getStatus() == ArticleStatus.PUBLISHED) {
          throw new IllegalArgumentException("Users cannot publish articles directly");
        }
        article.setStatus(articleDTO.getStatus() != null ? articleDTO.getStatus() : ArticleStatus.DRAFT);
      } else {
        article.setStatus(articleDTO.getStatus() != null ? articleDTO.getStatus() : ArticleStatus.DRAFT);
      }

      article.setCreatedBy(username);
      Article savedArticle = articleRepository.save(article);

      if (user.getRole() == UserRole.USER && articleDTO.getPaymentId() != null) {
        paymentService.attachArticleToPayment(articleDTO.getPaymentId(), savedArticle.getId());
      }

      return savedArticle;
    } catch (RuntimeException e) {
      if (!isProduction) {
        log.error("Failed to create article: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to create article", e);
    }
  }

  // Validates image count in article content
  private void validateImageCount(ArticleDTO articleDTO) {
    int imageCount = 0;
    if (articleDTO.getHeaderImage() != null && !articleDTO.getHeaderImage().isEmpty()) {
      imageCount++;
    }
    Document doc = Jsoup.parse(articleDTO.getContent());
    Elements imgElements = doc.select("img");
    imageCount += imgElements.size();

    if (imageCount > 5) {
      throw new IllegalArgumentException("Article cannot contain more than 5 images");
    }
  }

  // Builds article from DTO
  private Article buildArticleFromDto(ArticleDTO articleDTO) {
    Article article = new Article();
    article.setApp(articleDTO.getApp());
    article.setCompany(articleDTO.getCompany());
    article.setTitle(articleDTO.getTitle());
    article.setDescription(articleDTO.getDescription());
    article.setHeaderImage(articleDTO.getHeaderImage());
    article.setHeaderImagePublicId(articleDTO.getHeaderImagePublicId());
    article.setHeaderImageUploadDate(articleDTO.getHeaderImageUploadDate());

    String categoryName = articleDTO.getCategory().getName();
    Category category = categoryRepository.findByName(categoryName)
      .orElseThrow(() -> new RuntimeException("Category not found"));
    article.setCategory(category);
    article.setCategoryName(categoryName);
    article.setCategorySlug(category.getSlug());

    article.setContent(articleDTO.getContent());
    article.setPublishDate(articleDTO.getPublishDate());
    article.setPromoVideo(articleDTO.getPromoVideo());
    article.setPromoVideoPublicId(articleDTO.getPromoVideoPublicId());
    article.setPromoVideoUploadDate(articleDTO.getPromoVideoUploadDate());
    article.setStatus(articleDTO.getStatus());

    return article;
  }

  // Retrieves all articles
  public List<Article> getAllArticles() {
    return articleRepository.findAll();
  }

  // Retrieves article by ID
  public Optional<Article> getArticleById(Long id) {
    return articleRepository.findById(id);
  }

  // Approves an article
  public Optional<Article> approveArticle(Long id) {
    Optional<Article> articleOpt = articleRepository.findById(id);
    if (articleOpt.isPresent()) {
      Article article = articleOpt.get();

      if (article.getStatus() != ArticleStatus.PENDING_APPROVAL) {
        throw new IllegalStateException("Only pending articles can be approved");
      }

      article.setStatus(ArticleStatus.PUBLISHED);
      article.setPublishDate(LocalDate.now());

      Article updatedArticle = articleRepository.save(article);
      return Optional.of(updatedArticle);
    }
    return Optional.empty();
  }

  // Deletes an article and associated payments
  @Transactional
  public boolean deleteArticle(Long id) {
    try {
      Optional<Article> optionalArticle = articleRepository.findById(id);
      if (optionalArticle.isEmpty()) {
        return false;
      }

      Article article = optionalArticle.get();

      // ✅ Desvincular todos los pagos asociados
      List<Payment> allPayments = paymentRepository.findByArticle(article);
      allPayments.forEach(payment -> {
        payment.setArticle(null);
        paymentRepository.save(payment);
      });

      // 🗑️ Eliminar el artículo
      articleRepository.delete(article);
      return true;

    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to delete article with ID: {}", id, e);
      }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete article");
    }
  }


  // Deletes an orphan image from Cloudinary
  public boolean deleteOrphanImage(String publicId) {
    try {
      @SuppressWarnings("unchecked")
      Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
      return "ok".equals(result.get("result"));
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to delete orphan image: {}", publicId);
      }
      return false;
    }
  }

  // Submits an article for review
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

  // Retrieves articles by status
  public List<Article> getArticlesByStatus(ArticleStatus status) {
    return articleRepository.findByStatus(status);
  }

  // Updates an existing article
  public Optional<Article> updateArticle(Long id, ArticleDTO articleDTO) {
    try {
      return articleRepository.findById(id).map(article -> {
        article.setCompany(articleDTO.getCompany());
        article.setApp(articleDTO.getApp());
        article.setTitle(articleDTO.getTitle());
        article.setDescription(articleDTO.getDescription());
        article.setHeaderImage(articleDTO.getHeaderImage());
        article.setHeaderImagePublicId(articleDTO.getHeaderImagePublicId());
        article.setHeaderImageUploadDate(articleDTO.getHeaderImageUploadDate());

        String categoryName = articleDTO.getCategory().getName();
        Category category = categoryRepository.findByName(categoryName)
          .orElseThrow(() -> new RuntimeException("Category not found"));
        article.setCategory(category);
        article.setCategoryName(categoryName);
        article.setCategorySlug(category.getSlug());

        article.setContent(articleDTO.getContent());
        article.setPublishDate(articleDTO.getPublishDate());
        article.setPromoVideo(articleDTO.getPromoVideo());
        article.setPromoVideoPublicId(articleDTO.getPromoVideoPublicId());
        article.setPromoVideoUploadDate(articleDTO.getPromoVideoUploadDate());
        article.setStatus(articleDTO.getStatus());

        if (!isProduction) {
          log.info("Updating article ID: {} with status: {}", id, articleDTO.getStatus());
        }

        return articleRepository.save(article);
      });
    } catch (RuntimeException e) {
      if (!isProduction) {
        log.error("Failed to update article with ID: {}", id);
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to update article");
    }
  }

  // Retrieves draft articles by user
  public List<Article> getDraftsByUser(String username) {
    return articleRepository.findByStatusAndCreatedBy(ArticleStatus.DRAFT, username);
  }

  // Retrieves published articles by user
  public List<ArticleDTO> getPublishedArticlesByUser(String username) {
    try {
      List<Article> articles = articleRepository.findByStatusAndCreatedBy(ArticleStatus.PUBLISHED, username);

      return articles.stream().map(article -> {
        ArticleDTO dto = mapToDTO(article);

        paymentRepository.findByArticle(article).stream()
          .filter(p -> "COMPLETED".equals(p.getStatus()))
          .max((p1, p2) -> p1.getCompletedAt().compareTo(p2.getCompletedAt()))
          .ifPresent(payment -> {
            dto.setPlanType(payment.getPlanType());
            dto.setExpirationAt(payment.getExpirationAt());

            if (!isProduction) {
              log.info("Article ID: {} linked to planType: {}, expires: {}",
                article.getId(), payment.getPlanType(), payment.getExpirationAt());
            }
          });

        return dto;
      }).toList();
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to retrieve published articles for user: {}", username);
      }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve published articles");
    }
  }

  // Retrieves pending articles by user
  public List<Article> getPendingArticlesByUser(String username) {
    return articleRepository.findByStatusAndCreatedBy(ArticleStatus.PENDING_APPROVAL, username);
  }

  // Deletes an orphan video from Cloudinary
  public boolean deleteOrphanVideo(String publicId) {
    try {
      @SuppressWarnings("unchecked")
      Map<String, Object> result = cloudinary.uploader().destroy(
        publicId,
        Map.of("resource_type", "video")
      );
      return "ok".equals(result.get("result"));
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to delete orphan video: {}", publicId);
      }
      return false;
    }
  }

  // Retrieves articles by category slug
  public List<Article> getArticlesByCategorySlug(String slug) {
    return articleRepository.findByCategorySlugIgnoreCaseAndStatus(slug, ArticleStatus.PUBLISHED);
  }

  // Rejects an article with a reason
  public Optional<Article> rejectArticle(Long id, String reason) {
    Optional<Article> articleOpt = articleRepository.findById(id);
    if (articleOpt.isPresent()) {
      Article article = articleOpt.get();

      if (article.getStatus() != ArticleStatus.PENDING_APPROVAL) {
        throw new IllegalStateException("Only pending articles can be rejected");
      }

      article.setStatus(ArticleStatus.REJECTED);
      article.setRejectionReason(reason);
      Article updated = articleRepository.save(article);

      return Optional.of(updated);
    }
    return Optional.empty();
  }

  // Retrieves rejected articles by user
  public List<Article> getRejectedArticlesByUser(String username) {
    return articleRepository.findByStatusAndCreatedBy(ArticleStatus.REJECTED, username);
  }

  // Retrieves promoted videos by type
  public List<Article> getPromotedVideosByType(PromoteType type) {
    return articleRepository.findByStatus(ArticleStatus.PUBLISHED).stream()
      .filter(article -> article.getPromotions().stream()
        .anyMatch(promotion ->
          promotion.getPromoteType() == type &&
            (promotion.getExpirationAt() == null || promotion.getExpirationAt().isAfter(LocalDateTime.now()))
        )
      )
      .toList();
  }

  // Retrieves promoted videos by category slug with rotation
  public List<Article> getPromotedVideosByCategorySlug(String slug) {
    List<Article> articles = articleRepository.findByCategorySlugIgnoreCaseAndStatus(slug, ArticleStatus.PUBLISHED)
      .stream()
      .filter(article -> article.getPromotions().stream()
        .anyMatch(promotion ->
          promotion.getPromoteType() == PromoteType.CATEGORY_SLIDER &&
            (promotion.getExpirationAt() == null || promotion.getExpirationAt().isAfter(LocalDateTime.now()))
        )
      )
      .toList();

    if (articles.isEmpty()) return articles;

    int dayOfYear = LocalDate.now().getDayOfYear();
    int rotationIndex = dayOfYear % articles.size();

    List<Article> rotated = new ArrayList<>();
    rotated.addAll(articles.subList(rotationIndex, articles.size()));
    rotated.addAll(articles.subList(0, rotationIndex));

    return rotated;
  }

  // Retrieves promoted videos for main slider with rotation
  public List<Article> getPromotedVideosForMainSlider() {
    List<Article> articles = articleRepository.findByStatus(ArticleStatus.PUBLISHED).stream()
      .filter(article -> article.getPromotions().stream()
        .anyMatch(promotion ->
          promotion.getPromoteType() == PromoteType.MAIN_SLIDER &&
            (promotion.getExpirationAt() == null || promotion.getExpirationAt().isAfter(LocalDateTime.now()))
        )
      )
      .toList();

    if (articles.isEmpty()) return articles;

    int dayOfYear = LocalDate.now().getDayOfYear();
    int rotationIndex = dayOfYear % articles.size();

    List<Article> rotated = new ArrayList<>();
    rotated.addAll(articles.subList(rotationIndex, articles.size()));
    rotated.addAll(articles.subList(0, rotationIndex));

    return rotated;
  }

  // Maps article to DTO
  public ArticleDTO mapToDTO(Article article) {
    ArticleDTO dto = new ArticleDTO();

    dto.setId(article.getId());
    dto.setApp(article.getApp());
    dto.setCompany(article.getCompany());
    dto.setTitle(article.getTitle());
    dto.setDescription(article.getDescription());
    dto.setHeaderImage(article.getHeaderImage());
    dto.setHeaderImagePublicId(article.getHeaderImagePublicId());
    dto.setHeaderImageUploadDate(article.getHeaderImageUploadDate());

    dto.setCategory(new CategoryDTO(article.getCategoryName(), article.getCategorySlug()));
    dto.setContent(article.getContent());
    dto.setPublishDate(article.getPublishDate());
    dto.setPromoVideo(article.getPromoVideo());
    dto.setPromoVideoPublicId(article.getPromoVideoPublicId());
    dto.setPromoVideoUploadDate(article.getPromoVideoUploadDate());
    dto.setStatus(article.getStatus());
    dto.setCreatedBy(article.getCreatedBy());
    dto.setRejectionReason(article.getRejectionReason());

    List<ActivePlanDTO> activePlans = article.getPromotions().stream()
      .filter(promotion -> promotion.getExpirationAt() == null || promotion.getExpirationAt().isAfter(LocalDateTime.now()))
      .map(promotion -> new ActivePlanDTO(
        promotion.getPromoteType().name(),
        promotion.getExpirationAt(),
        promotion.isCancelled()
      ))
      .toList();

    dto.setActivePlans(activePlans);

    return dto;
  }

  // Retrieves featured articles with rotation
  public List<ArticleDTO> getFeaturedArticlesRotated() {
    List<Article> articles = articleRepository.findByStatus(ArticleStatus.PUBLISHED);

    List<ArticleDTO> featured = articles.stream()
      .map(this::mapToDTO)
      .filter(dto -> dto.getActivePlans() != null && dto.getActivePlans().stream()
        .anyMatch(plan -> !plan.isCancelled() &&
          (plan.getPlanType().equals("MAIN_SLIDER") || plan.getPlanType().equals("CATEGORY_SLIDER")) &&
          (plan.getExpirationAt() == null || plan.getExpirationAt().isAfter(LocalDateTime.now()))
        )
      ).toList();

    if (featured.isEmpty()) return featured;

    int dayOfYear = LocalDate.now().getDayOfYear();
    int rotationIndex = dayOfYear % featured.size();

    List<ArticleDTO> rotated = new ArrayList<>();
    rotated.addAll(featured.subList(rotationIndex, featured.size()));
    rotated.addAll(featured.subList(0, rotationIndex));

    return rotated;
  }
}
