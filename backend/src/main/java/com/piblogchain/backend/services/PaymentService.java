package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.*;
import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.enums.PlanType;
import com.piblogchain.backend.enums.PromoteType;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.models.ArticlePromotion;
import com.piblogchain.backend.models.Category;
import com.piblogchain.backend.models.Payment;
import com.piblogchain.backend.repositories.ArticlePromotionRepository;
import com.piblogchain.backend.repositories.ArticleRepository;
import com.piblogchain.backend.repositories.CategoryRepository;
import com.piblogchain.backend.repositories.PaymentRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

  private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

  @Value("${pi.api.key}")
  private String piApiKey;

  private final Environment env;
  private final PaymentRepository paymentRepository;
  private final ArticleRepository articleRepository;
  private final CategoryRepository categoryRepository;
  private final ArticlePromotionRepository articlePromotionRepository;
  private final boolean isProduction;
  private Double cachedPiPriceUsd = null;
  private LocalDateTime lastFetchTime = null;
  private static final int CACHE_DURATION_SECONDS = 60;


  public PaymentService(
    Environment env,
    PaymentRepository paymentRepository,
    ArticleRepository articleRepository,
    CategoryRepository categoryRepository,
    ArticlePromotionRepository articlePromotionRepository,
    @Value("${app.production:false}") boolean isProduction
  ) {
    this.env = env;
    this.paymentRepository = paymentRepository;
    this.articleRepository = articleRepository;
    this.categoryRepository = categoryRepository;
    this.articlePromotionRepository = articlePromotionRepository;
    this.isProduction = isProduction;
  }

  // Creates a new payment
  public Map<String, Object> createPayment(PaymentCreateRequest request) {
    try {
      if (request == null || request.getPaymentId() == null || request.getPaymentId().isBlank()) {
        throw new IllegalArgumentException("Payment ID is required");
      }
      if (request.getUsername() == null || request.getUsername().isBlank()) {
        throw new IllegalArgumentException("Username is required");
      }
      if (request.getPlanType() == null) {
        throw new IllegalArgumentException("Plan type is required");
      }

      double amount = getPlanPrice(request.getPlanType());
      String memo = "Payment for plan: " + request.getPlanType();

      Payment payment = new Payment();
      payment.setPaymentId(request.getPaymentId());
      payment.setUsername(request.getUsername());
      payment.setPlanType(request.getPlanType().name());
      payment.setStatus("CREATED");
      payment.setSandbox(env.acceptsProfiles("sandbox"));
      payment.setCreatedAt(LocalDateTime.now());

      Payment savedPayment = paymentRepository.save(payment);
      if (!isProduction) {
        log.info("Payment created with ID: {}", savedPayment.getPaymentId());
      }

      Map<String, Object> response = new HashMap<>();
      response.put("amount", amount);
      response.put("memo", memo);

      Map<String, Object> metadata = new HashMap<>();
      metadata.put("planType", request.getPlanType().name());
      metadata.put("username", request.getUsername());

      response.put("metadata", metadata);
      response.put("paymentId", request.getPaymentId());

      return response;
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to create payment: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to create payment");
    }
  }

  // Approves a payment
  public void approvePayment(PaymentApprovalRequest request) {
    try {
      if (request == null || request.getPaymentId() == null || request.getPaymentId().isBlank()) {
        throw new IllegalArgumentException("Payment ID is required");
      }

      Payment payment = findPaymentOrThrow(request.getPaymentId());
      payment.setStatus("APPROVED");
      paymentRepository.save(payment);
      if (!isProduction) {
        log.info("Payment approved with ID: {}", request.getPaymentId());
      }
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to approve payment: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to approve payment");
    }
  }

  // Completes a payment and associates it with an article
  public void completePayment(PaymentCompleteRequest request) {
    try {
      if (request == null || request.getPaymentId() == null || request.getPaymentId().isBlank()) {
        throw new IllegalArgumentException("Payment ID is required");
      }
      if (request.getTxid() == null || request.getTxid().isBlank()) {
        throw new IllegalArgumentException("Transaction ID is required");
      }

      Payment payment = findPaymentOrThrow(request.getPaymentId());
      payment.setStatus("COMPLETED");
      payment.setTxid(request.getTxid());
      payment.setCompletedAt(LocalDateTime.now());

      PlanType plan = PlanType.valueOf(payment.getPlanType());
      PromoteType promoteType = switch (plan) {
        case STANDARD -> PromoteType.STANDARD;
        case CATEGORY_SLIDER -> PromoteType.CATEGORY_SLIDER;
        case MAIN_SLIDER -> PromoteType.MAIN_SLIDER;
      };

      Article article;
      if (request.getArticleId() != null) {
        article = articleRepository.findById(request.getArticleId())
          .orElseThrow(() -> new IllegalArgumentException("Article not found"));
      } else {
        article = new Article();
        article.setCreatedBy(payment.getUsername());
        article.setStatus(ArticleStatus.DRAFT);
        article.setPublishDate(LocalDate.now());
        article.setApp("");
        article.setCompany("");
        article.setTitle("");
        article.setDescription("");
        article.setContent("");

        Category defaultCategory = categoryRepository.findBySlug("sin-categoria")
          .orElseThrow(() -> new IllegalArgumentException("Default category not found"));
        article.setCategory(defaultCategory);
      }

      if (promoteType != PromoteType.STANDARD && !isSlotAvailable(promoteType, article.getCategory().getSlug())) {
        throw new IllegalArgumentException("No slots available for plan: " + promoteType);
      }

      payment.setArticle(article);

      ArticlePromotion promotion = new ArticlePromotion();
      promotion.setArticle(article);
      promotion.setPromoteType(promoteType);

      if (plan != PlanType.STANDARD) {
        Payment previous = paymentRepository.findTopByArticleAndStatusOrderByExpirationAtDesc(article, "COMPLETED");
        LocalDateTime baseDate = LocalDateTime.now();
        if (previous != null && previous.getExpirationAt() != null && previous.getExpirationAt().isAfter(LocalDateTime.now())) {
          baseDate = previous.getExpirationAt();
        }
        payment.setExpirationAt(baseDate.plusDays(30));
        promotion.setExpirationAt(baseDate.plusDays(30));
      }

      article.getPromotions().add(promotion);
      articleRepository.save(article);
      paymentRepository.save(payment);

      if (!isProduction) {
        log.info("Payment completed with ID: {}, article ID: {}", request.getPaymentId(), article.getId());
      }
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to complete payment: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to complete payment");
    }
  }

  // Attaches an article to a payment
  public void attachArticleToPayment(String paymentId, Long articleId) {
    try {
      if (paymentId == null || paymentId.isBlank()) {
        throw new IllegalArgumentException("Payment ID is required");
      }
      if (articleId == null) {
        throw new IllegalArgumentException("Article ID is required");
      }

      Payment payment = findPaymentOrThrow(paymentId);
      Article article = articleRepository.findById(articleId)
        .orElseThrow(() -> new IllegalArgumentException("Article not found"));

      payment.setArticle(article);
      paymentRepository.save(payment);
      if (!isProduction) {
        log.info("Article ID: {} attached to payment ID: {}", articleId, paymentId);
      }
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to attach article to payment: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to attach article to payment");
    }
  }

  // Retrieves the active plan for a user
  public String getActivePlanForUser(String username) {
    try {
      if (username == null || username.isBlank()) {
        throw new IllegalArgumentException("Username is required");
      }

      Payment active = paymentRepository.findTopByUsernameAndStatusOrderByCompletedAtDesc(username, "COMPLETED");
      if (active != null && active.getExpirationAt() != null && active.getExpirationAt().isAfter(LocalDateTime.now())) {
        return active.getPlanType();
      }
      return "NONE";
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to retrieve active plan for user: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve active plan");
    }
  }

  // Retrieves active plan details for a user
  public Map<String, Object> getActivePlanDetails(String username) {
    try {
      if (username == null || username.isBlank()) {
        throw new IllegalArgumentException("Username is required");
      }

      Payment active = paymentRepository.findTopByUsernameAndStatusOrderByCompletedAtDesc(username, "COMPLETED");
      Map<String, Object> response = new HashMap<>();
      if (active != null && (
        active.getPlanType().equals("STANDARD") ||
          (active.getExpirationAt() != null && active.getExpirationAt().isAfter(LocalDateTime.now()))
      )) {
        response.put("planType", active.getPlanType());
        response.put("expirationAt", active.getExpirationAt());
      } else {
        response.put("planType", "NONE");
      }
      return response;
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to retrieve active plan details: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve active plan details");
    }
  }

  // Retrieves plan price based on type
  private double getPlanPrice(PlanType planType) {
    double priceInPi = switch (planType) {
      case STANDARD -> 3.00;
      case CATEGORY_SLIDER -> 20.00;
      case MAIN_SLIDER -> 30.00;
    };
    double piPriceUSD = getCurrentPiPriceUSD();
    return priceInPi * piPriceUSD;
  }


  // Finds a payment by ID or throws an exception
  private Payment findPaymentOrThrow(String paymentId) {
    return paymentRepository.findByPaymentId(paymentId)
      .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
  }

  // Retrieves a payment by ID
  public Payment getByPaymentId(String paymentId) {
    try {
      if (paymentId == null || paymentId.isBlank()) {
        throw new IllegalArgumentException("Payment ID is required");
      }
      return findPaymentOrThrow(paymentId);
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to retrieve payment: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to retrieve payment");
    }
  }

  // Retrieves payment details by article ID
  public Map<String, Object> getPaymentByArticleId(Long articleId) {
    try {
      if (articleId == null) {
        throw new IllegalArgumentException("Article ID is required");
      }

      List<Payment> payments = paymentRepository.findByArticleId(articleId);
      if (payments.isEmpty()) {
        throw new IllegalArgumentException("No payment found for article");
      }

      Payment latest = payments.stream()
        .filter(p -> "COMPLETED".equals(p.getStatus()))
        .max((p1, p2) -> p1.getCompletedAt().compareTo(p2.getCompletedAt()))
        .orElseThrow(() -> new IllegalArgumentException("No completed payments found for article"));

      Map<String, Object> response = new HashMap<>();
      response.put("planType", latest.getPlanType());
      response.put("expirationAt", latest.getExpirationAt());

      return response;
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to retrieve payment for article ID: {}", articleId);
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to retrieve payment for article");
    }
  }

  // Checks slot availability for a promotion type
  public boolean isSlotAvailable(PromoteType promoteType, String categorySlug) {
    try {
      if (promoteType == null) {
        throw new IllegalArgumentException("Promotion type is required");
      }
      if (promoteType == PromoteType.CATEGORY_SLIDER && (categorySlug == null || categorySlug.isBlank())) {
        throw new IllegalArgumentException("Category slug is required for CATEGORY_SLIDER");
      }

      if (promoteType == PromoteType.MAIN_SLIDER) {
        long count = articleRepository.findByStatus(ArticleStatus.PUBLISHED)
          .stream()
          .filter(article -> article.getPromotions().stream()
            .anyMatch(promotion ->
              promotion.getPromoteType() == PromoteType.MAIN_SLIDER &&
                (promotion.getExpirationAt() == null || promotion.getExpirationAt().isAfter(LocalDateTime.now()))
            )
          )
          .count();
        return count < 7;
      } else if (promoteType == PromoteType.CATEGORY_SLIDER) {
        long count = articleRepository.findByCategorySlugIgnoreCaseAndStatus(categorySlug, ArticleStatus.PUBLISHED)
          .stream()
          .filter(article -> article.getPromotions().stream()
            .anyMatch(promotion ->
              promotion.getPromoteType() == PromoteType.CATEGORY_SLIDER &&
                (promotion.getExpirationAt() == null || promotion.getExpirationAt().isAfter(LocalDateTime.now()))
            )
          )
          .count();
        return count < 7;
      }
      return true;
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to check slot availability: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to check slot availability");
    }
  }

  // Retrieves slot availability details
  public Map<String, Object> getSlotAvailability(PromoteType promoteType, String categorySlug) {
    try {
      if (promoteType == null) {
        throw new IllegalArgumentException("Promotion type is required");
      }
      if (promoteType == PromoteType.CATEGORY_SLIDER && (categorySlug == null || categorySlug.isBlank())) {
        throw new IllegalArgumentException("Category slug is required for CATEGORY_SLIDER");
      }

      final int totalSlots = (promoteType == PromoteType.STANDARD) ? Integer.MAX_VALUE : 7;
      long usedSlots = 0;
      String categoryName = null;

      PlanType planType = PlanType.valueOf(promoteType.name());
      double price = getPlanPrice(planType);

      if (promoteType == PromoteType.MAIN_SLIDER) {
        usedSlots = articleRepository.findByStatus(ArticleStatus.PUBLISHED).stream()
          .filter(article -> article.getPromotions().stream()
            .anyMatch(promotion ->
              promotion.getPromoteType() == promoteType &&
                (promotion.getExpirationAt() == null || promotion.getExpirationAt().isAfter(LocalDateTime.now()))
            )
          )
          .count();
      } else if (promoteType == PromoteType.CATEGORY_SLIDER) {
        usedSlots = articleRepository.findByCategorySlugIgnoreCaseAndStatus(categorySlug, ArticleStatus.PUBLISHED).stream()
          .filter(article -> article.getPromotions().stream()
            .anyMatch(promotion ->
              promotion.getPromoteType() == promoteType &&
                (promotion.getExpirationAt() == null || promotion.getExpirationAt().isAfter(LocalDateTime.now()))
            )
          )
          .count();
        Category category = categoryRepository.findBySlug(categorySlug)
          .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        categoryName = category.getName();
      }

      int remainingSlots = (int) Math.max(0, totalSlots - usedSlots);

      Map<String, Object> response = new HashMap<>();
      response.put("available", remainingSlots > 0);
      response.put("usedSlots", usedSlots);
      response.put("remainingSlots", remainingSlots);
      response.put("totalSlots", totalSlots);
      response.put("categoryName", categoryName);
      response.put("price", price);

      return response;
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to retrieve slot availability: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to retrieve slot availability");
    }
  }

  // Activates a plan for an article
  public Map<String, Object> activatePlan(ActivatePlanRequest request) {
    try {
      if (request == null || request.getArticleId() == null) {
        throw new IllegalArgumentException("Article ID is required");
      }
      if (request.getPlanType() == null) {
        throw new IllegalArgumentException("Plan type is required");
      }
      PromoteType promoteType = PromoteType.valueOf(request.getPlanType());
      if (promoteType == PromoteType.CATEGORY_SLIDER && (request.getCategorySlug() == null || request.getCategorySlug().isBlank())) {
        throw new IllegalArgumentException("Category slug is required for CATEGORY_SLIDER");
      }

      Article article = articleRepository.findById(request.getArticleId())
        .orElseThrow(() -> new IllegalArgumentException("Article not found"));

      if (promoteType != PromoteType.STANDARD && !isSlotAvailable(promoteType, request.getCategorySlug())) {
        throw new IllegalArgumentException("No slots available for plan: " + promoteType);
      }

      LocalDateTime expirationAt = LocalDateTime.now().plusDays(30);

      ArticlePromotion promotion = new ArticlePromotion();
      promotion.setArticle(article);
      promotion.setPromoteType(promoteType);
      promotion.setExpirationAt(expirationAt);
      promotion.setCancelled(false);
      article.getPromotions().add(promotion);

      Payment payment = new Payment();
      payment.setPlanType(promoteType.name());
      payment.setStatus("COMPLETED");
      payment.setCreatedAt(LocalDateTime.now());
      payment.setCompletedAt(LocalDateTime.now());
      payment.setExpirationAt(expirationAt);
      payment.setPaymentId("manual-" + System.currentTimeMillis());
      payment.setUsername(article.getCreatedBy());
      payment.setArticle(article);
      payment.setSandbox(env.acceptsProfiles("sandbox")); // ✅ correcto para distinguir entorno

      articleRepository.save(article);
      paymentRepository.save(payment);

      Map<String, Object> response = new HashMap<>();
      response.put("message", "Plan activated successfully.");
      response.put("expirationAt", expirationAt);
      return response;
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to activate plan: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to activate plan");
    }
  }



  // Cancels a subscription for an article
  @Transactional
  public void cancelSubscription(Long articleId, String planType) {
    try {
      if (articleId == null) {
        throw new IllegalArgumentException("Article ID is required");
      }
      if (planType == null || planType.isBlank()) {
        throw new IllegalArgumentException("Plan type is required");
      }

      Article article = articleRepository.findById(articleId)
        .orElseThrow(() -> new IllegalArgumentException("Article not found"));
      PromoteType promoteType = PromoteType.valueOf(planType);

      article.getPromotions().forEach(promotion -> {
        if (promotion.getPromoteType() == promoteType) {
          promotion.setCancelled(true);
        }
      });

      articleRepository.save(article);
      if (!isProduction) {
        log.info("Subscription cancelled for article ID: {}, plan: {}", articleId, planType);
      }
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to cancel subscription: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to cancel subscription");
    }
  }

  // Activates a plan without payment
  public void activateWithoutPayment(ActivatePlanRequest request) {
    try {
      if (request == null || request.getArticleId() == null) {
        throw new IllegalArgumentException("Article ID is required");
      }
      if (request.getPlanType() == null) {
        throw new IllegalArgumentException("Plan type is required");
      }

      Article article = articleRepository.findById(request.getArticleId())
        .orElseThrow(() -> new IllegalArgumentException("Article not found"));
      PromoteType promoteType = PromoteType.valueOf(request.getPlanType());
      LocalDateTime expirationAt = LocalDateTime.now().plusMonths(1);

      ArticlePromotion promotion = new ArticlePromotion();
      promotion.setArticle(article);
      promotion.setPromoteType(promoteType);
      promotion.setExpirationAt(expirationAt);
      promotion.setCancelled(false);

      articlePromotionRepository.save(promotion);
      if (!isProduction) {
        log.info("Plan activated without payment for article ID: {}, plan: {}", request.getArticleId(), request.getPlanType());
      }
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to activate plan without payment: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to activate plan without payment");
    }
  }

  public double getCurrentPiPriceUSD() {
    LocalDateTime now = LocalDateTime.now();

    // Si tenemos un precio en caché y no ha expirado, lo devolvemos
    if (cachedPiPriceUsd != null && lastFetchTime != null &&
      lastFetchTime.plusSeconds(CACHE_DURATION_SECONDS).isAfter(now)) {
      return cachedPiPriceUsd;
    }

    // Si no, lo pedimos de nuevo
    String url = "https://www.okx.com/api/v5/market/ticker?instId=PI-USD";
    try {
      RestTemplate restTemplate = new RestTemplate();
      Map<String, Object> response = restTemplate.getForObject(url, Map.class);
      List<Map<String, String>> data = (List<Map<String, String>>) response.get("data");
      double price = Double.parseDouble(data.get(0).get("last"));

      // Guardamos en la caché
      cachedPiPriceUsd = price;
      lastFetchTime = now;

      return price;
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Error fetching Pi price: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cannot fetch current Pi price");
    }
  }


  public Map<String, Object> getPlanPricesInUsd() {
    double piPrice = getCurrentPiPriceUSD();

    Map<String, Object> prices = new HashMap<>();
    prices.put("piPriceUsd", roundUp(piPrice, 4));
    prices.put("STANDARD", roundUp(3.5 / piPrice, 2));
    prices.put("CATEGORY_SLIDER", roundUp(25.0 / piPrice, 2));
    prices.put("MAIN_SLIDER", roundUp(35.0 / piPrice, 2));

    return prices;
  }


  private double roundUp(double value, int decimalPlaces) {
    double scale = Math.pow(10, decimalPlaces);
    return Math.ceil(value * scale) / scale;
  }



}
