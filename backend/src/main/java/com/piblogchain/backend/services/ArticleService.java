package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.ActivePlanDTO;
import com.piblogchain.backend.dto.ArticleDTO;
import com.piblogchain.backend.dto.CategoryDTO;
import com.piblogchain.backend.enums.ArticleStatus;
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

@Service
public class ArticleService {

  private final ArticleRepository articleRepository;
  private final CategoryRepository categoryRepository;
  private final UserRepository userRepository;
  private final Cloudinary cloudinary;
  private final PaymentRepository paymentRepository;
  private final PaymentService paymentService;

  @Autowired
  public ArticleService(
    ArticleRepository articleRepository,
    CategoryRepository categoryRepository,
    UserRepository userRepository,
    PaymentRepository paymentRepository,
    PaymentService paymentService,
    @Value("${cloudinary.url}") String cloudinaryUrl
  ) {
    this.articleRepository = articleRepository;
    this.categoryRepository = categoryRepository;
    this.userRepository = userRepository;
    this.paymentRepository = paymentRepository;
    this.paymentService = paymentService;
    this.cloudinary = new Cloudinary(cloudinaryUrl);
  }

  public Article createArticle(ArticleDTO articleDTO, String username) {
    try {
      validateImageCount(articleDTO);
      if (articleDTO.getCategory() == null || articleDTO.getCategory().getName() == null) {
        throw new IllegalArgumentException("El nombre de la categoría es obligatorio");
      }
      User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + username));
      Article article = buildArticleFromDto(articleDTO);

      if (user.getRole() == UserRole.USER) {
        if (articleDTO.getStatus() == ArticleStatus.PUBLISHED) {
          throw new IllegalArgumentException("Los usuarios no pueden publicar artículos directamente.");
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
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
    }
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
    article.setApp(articleDTO.getApp());
    article.setCompany(articleDTO.getCompany());
    article.setTitle(articleDTO.getTitle());
    article.setDescription(articleDTO.getDescription());
    article.setHeaderImage(articleDTO.getHeaderImage());
    article.setHeaderImagePublicId(articleDTO.getHeaderImagePublicId());
    article.setHeaderImageUploadDate(articleDTO.getHeaderImageUploadDate());

    String categoryName = articleDTO.getCategory().getName();
    Category category = categoryRepository.findByName(categoryName)
      .orElseThrow(() -> new RuntimeException("Category not found: " + categoryName));
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

  @Transactional
  public boolean deleteArticle(Long id) {
    Optional<Article> optionalArticle = articleRepository.findById(id);
    if (optionalArticle.isEmpty()) {
      return false;
    }

    Article article = optionalArticle.get();

    List<Payment> payments = paymentRepository.findByArticle(article);
    payments.forEach(paymentRepository::delete);


    articleRepository.delete(article);

    return true;
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

      String categoryName = articleDTO.getCategory().getName();
      Category category = categoryRepository.findByName(categoryName)
        .orElseThrow(() -> new RuntimeException("Category not found: " + categoryName));
      article.setCategory(category);
      article.setCategoryName(categoryName);
      article.setCategorySlug(category.getSlug());

      article.setContent(articleDTO.getContent());
      article.setPublishDate(articleDTO.getPublishDate());
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

  public List<ArticleDTO> getPublishedArticlesByUser(String username) {
    List<Article> articles = articleRepository.findByStatusAndCreatedBy(ArticleStatus.PUBLISHED, username);

    return articles.stream().map(article -> {
      ArticleDTO dto = mapToDTO(article); // Tu método personalizado para convertir Article a ArticleDTO

      // 🔗 Vincula la información del pago si existe
      paymentRepository.findByArticle(article).stream()
        .filter(p -> "COMPLETED".equals(p.getStatus()))
        .max((p1, p2) -> p1.getCompletedAt().compareTo(p2.getCompletedAt()))
        .ifPresent(payment -> {
          dto.setPlanType(payment.getPlanType());
          dto.setExpirationAt(payment.getExpirationAt());

          System.out.println("🔁 Article " + article.getId() +
            " => planType: " + payment.getPlanType() +
            ", expires: " + payment.getExpirationAt());
        });

      return dto;
    }).toList();
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

  public List<Article> getArticlesByCategorySlug(String slug) {
    return articleRepository.findByCategorySlugIgnoreCaseAndStatus(slug, ArticleStatus.PUBLISHED);
  }

  public Optional<Article> rejectArticle(Long id, String reason) {
    Optional<Article> articleOpt = articleRepository.findById(id);
    if (articleOpt.isPresent()) {
      Article article = articleOpt.get();

      if (article.getStatus() != ArticleStatus.PENDING_APPROVAL) {
        throw new IllegalStateException("Only pending articles can be rejected.");
      }

      article.setStatus(ArticleStatus.REJECTED);
      article.setRejectionReason(reason);
      Article updated = articleRepository.save(article);

      return Optional.of(updated);
    }
    return Optional.empty();
  }

  public List<Article> getRejectedArticlesByUser(String username) {
    return articleRepository.findByStatusAndCreatedBy(ArticleStatus.REJECTED, username);
  }

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


  public List<Article> getPromotedVideosByCategorySlug(String slug) {
    List<Article> articles = articleRepository.findByCategorySlugIgnoreCaseAndStatus(
        slug, ArticleStatus.PUBLISHED
      ).stream()
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
        promotion.isCancelled() // ✅ añadir estado cancelado
      ))
      .toList();


    dto.setActivePlans(activePlans);

    return dto;
  }

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

    // Rotar según el día del año (1–365)
    int dayOfYear = LocalDate.now().getDayOfYear();
    int rotationIndex = dayOfYear % featured.size();

    // Rotar la lista
    List<ArticleDTO> rotated = new ArrayList<>();
    rotated.addAll(featured.subList(rotationIndex, featured.size()));
    rotated.addAll(featured.subList(0, rotationIndex));

    return rotated;
  }


}
