package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.*;
import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.enums.PlanType;
import com.piblogchain.backend.enums.PromoteType;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.models.ArticlePromotion;
import com.piblogchain.backend.models.Category;
import com.piblogchain.backend.models.Payment;
import com.piblogchain.backend.repositories.ArticleRepository;
import com.piblogchain.backend.repositories.CategoryRepository;
import com.piblogchain.backend.repositories.PaymentRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

  @Value("${pi.api.key}")
  private String piApiKey;

  private final Environment env;
  private final PaymentRepository paymentRepository;
  private final ArticleRepository articleRepository;
  private final CategoryRepository categoryRepository;
  private boolean cancelled = false;



  public PaymentService(Environment env, PaymentRepository paymentRepository, ArticleRepository articleRepository, CategoryRepository categoryRepository) {
    this.env = env;
    this.paymentRepository = paymentRepository;
    this.articleRepository = articleRepository;
    this.categoryRepository = categoryRepository;
  }

  public Map<String, Object> createPayment(PaymentCreateRequest request) {
    double amount = getPlanPrice(request.getPlanType());
    String memo = "Payment for plan: " + request.getPlanType();

    String paymentId = request.getPaymentId(); // ✅ usa el del frontend

    Payment payment = new Payment();
    payment.setPaymentId(paymentId);
    payment.setUsername(request.getUsername());
    payment.setPlanType(request.getPlanType().name());
    payment.setStatus("CREATED");
    payment.setSandbox(env.acceptsProfiles("sandbox"));
    payment.setCreatedAt(LocalDateTime.now());

    System.out.println("Creando pago con paymentId: " + paymentId);
    Payment savedPayment = paymentRepository.save(payment);
    System.out.println("Pago guardado: " + savedPayment.getPaymentId() + ", ID: " + savedPayment.getId());

    Map<String, Object> response = new HashMap<>();
    response.put("amount", amount);
    response.put("memo", memo);

    Map<String, Object> metadata = new HashMap<>();
    metadata.put("planType", request.getPlanType().name());
    metadata.put("username", request.getUsername());

    response.put("metadata", metadata);
    response.put("paymentId", paymentId);

    return response;
  }

  public void approvePayment(PaymentApprovalRequest request) {
    System.out.println("✔ Approved payment: " + request.getPaymentId() + " - Plan: " + request.getPlanType());

    Payment payment = findPaymentOrThrow(request.getPaymentId());
    payment.setStatus("APPROVED");
    paymentRepository.save(payment);
  }

  public void completePayment(PaymentCompleteRequest request) {
    System.out.println("✅ Completed payment: " + request.getPaymentId() + " - TxID: " + request.getTxid());

    Payment payment = findPaymentOrThrow(request.getPaymentId());
    payment.setStatus("COMPLETED");
    payment.setTxid(request.getTxid());
    payment.setCompletedAt(LocalDateTime.now());

    PlanType plan = PlanType.valueOf(payment.getPlanType());

    if (request.getArticleId() != null) {
      // ✅ Caso: renovación (ya existe el artículo)
      Article article = articleRepository.findById(request.getArticleId())
        .orElseThrow(() -> new RuntimeException("Article not found"));

      PromoteType promoteType = switch (plan) {
        case STANDARD -> PromoteType.STANDARD;
        case CATEGORY_SLIDER -> PromoteType.CATEGORY_SLIDER;
        case MAIN_SLIDER -> PromoteType.MAIN_SLIDER;
      };

      if (promoteType != PromoteType.STANDARD &&
        !isSlotAvailable(promoteType, article.getCategory().getSlug())) {
        throw new RuntimeException("❌ No slots available for: " + promoteType);
      }

      payment.setArticle(article);

      // Crear nueva promoción para el artículo
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

    } else {
      // ✅ Caso: nueva compra (creamos nuevo artículo)
      Article article = new Article();
      article.setCreatedBy(payment.getUsername());
      article.setStatus(ArticleStatus.DRAFT);
      article.setPublishDate(LocalDate.now());
      article.setApp("");
      article.setCompany("");
      article.setTitle("");
      article.setDescription("");
      article.setContent("");

      Category defaultCategory = categoryRepository.findBySlug("sin-categoria")
        .orElseThrow(() -> new RuntimeException("Default category not found"));
      article.setCategory(defaultCategory);

      PromoteType promoteType = switch (plan) {
        case STANDARD -> PromoteType.STANDARD;
        case CATEGORY_SLIDER -> PromoteType.CATEGORY_SLIDER;
        case MAIN_SLIDER -> PromoteType.MAIN_SLIDER;
      };

      if (promoteType != PromoteType.STANDARD &&
        !isSlotAvailable(promoteType, defaultCategory.getSlug())) {
        throw new RuntimeException("❌ No slots available for: " + promoteType);
      }

      articleRepository.save(article);
      payment.setArticle(article);

      // Crear nueva promoción
      ArticlePromotion promotion = new ArticlePromotion();
      promotion.setArticle(article);
      promotion.setPromoteType(promoteType);

      if (plan != PlanType.STANDARD) {
        promotion.setExpirationAt(LocalDateTime.now().plusDays(30));
        payment.setExpirationAt(LocalDateTime.now().plusDays(30));
      }

      article.getPromotions().add(promotion);
    }

    paymentRepository.save(payment);
  }


  public void attachArticleToPayment(String paymentId, Long articleId) {
    Payment payment = findPaymentOrThrow(paymentId);
    Article article = articleRepository.findById(articleId)
      .orElseThrow(() -> new RuntimeException("Article not found: " + articleId));

    payment.setArticle(article);
    paymentRepository.save(payment);
  }


  public String getActivePlanForUser(String username) {
    Payment active = paymentRepository.findTopByUsernameAndStatusOrderByCompletedAtDesc(username, "COMPLETED");
    if (active != null && active.getExpirationAt() != null && active.getExpirationAt().isAfter(LocalDateTime.now())) {
      return active.getPlanType();
    }
    return "NONE";
  }

  public Map<String, Object> getActivePlanDetails(String username) {
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
  }

  private double getPlanPrice(PlanType planType) {
    return switch (planType) {
      case STANDARD -> 3.00;
      case CATEGORY_SLIDER -> 15.00;
      case MAIN_SLIDER -> 25.00;
    };
  }

  // ✅ Método reutilizable para evitar repetir el mismo error-check
  private Payment findPaymentOrThrow(String paymentId) {
    return paymentRepository.findByPaymentId(paymentId)
      .orElseThrow(() -> new RuntimeException("Payment not found"));
  }

  public Payment getByPaymentId(String paymentId) {
    return findPaymentOrThrow(paymentId);
  }

  public Map<String, Object> getPaymentByArticleId(Long articleId) {
    List<Payment> payments = paymentRepository.findByArticleId(articleId);

    if (payments.isEmpty()) {
      throw new RuntimeException("No se encontró un pago para el artículo con ID " + articleId);
    }

    // Buscar el pago más reciente COMPLETADO
    Payment latest = payments.stream()
      .filter(p -> "COMPLETED".equals(p.getStatus()))
      .max((p1, p2) -> p1.getCompletedAt().compareTo(p2.getCompletedAt()))
      .orElseThrow(() -> new RuntimeException("No hay pagos completados para este artículo."));

    Map<String, Object> response = new HashMap<>();
    response.put("planType", latest.getPlanType());
    response.put("expirationAt", latest.getExpirationAt());

    return response;
  }

  public boolean isSlotAvailable(PromoteType promoteType, String categorySlug) {
    if (promoteType == PromoteType.MAIN_SLIDER) {
      long count = articleRepository.findByStatus(ArticleStatus.PUBLISHED)
        .stream()
        .filter(article ->
          article.getPromotions().stream()
            .anyMatch(promotion ->
              promotion.getPromoteType() == PromoteType.MAIN_SLIDER &&
                (promotion.getExpirationAt() == null || promotion.getExpirationAt().isAfter(LocalDateTime.now()))
            )
        )
        .count();
      return count < 5;
    } else if (promoteType == PromoteType.CATEGORY_SLIDER) {
      long count = articleRepository.findByCategorySlugIgnoreCaseAndStatus(categorySlug, ArticleStatus.PUBLISHED)
        .stream()
        .filter(article ->
          article.getPromotions().stream()
            .anyMatch(promotion ->
              promotion.getPromoteType() == PromoteType.CATEGORY_SLIDER &&
                (promotion.getExpirationAt() == null || promotion.getExpirationAt().isAfter(LocalDateTime.now()))
            )
        )
        .count();
      return count < 5;
    }

    return true; // No hay límite para STANDARD
  }


  public Map<String, Object> getSlotAvailability(PromoteType promoteType, String categorySlug) {
    final int totalSlots = (promoteType == PromoteType.STANDARD) ? Integer.MAX_VALUE : 5;
    long usedSlots = 0;
    String categoryName = null;

    // Convierte PromoteType a PlanType y obtiene el precio dinámico
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
      if (categorySlug == null || categorySlug.isBlank()) {
        throw new IllegalArgumentException("Category slug is required for CATEGORY_SLIDER");
      }

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
  }


  public void activatePlan(ActivatePlanRequest request) {
    // Validar que existan articleId, username, planType
    Article article = articleRepository.findById(request.getArticleId())
      .orElseThrow(() -> new RuntimeException("Article not found"));

    PromoteType promoteType = PromoteType.valueOf(request.getPlanType());

    if (promoteType != PromoteType.STANDARD) {
      if (!isSlotAvailable(promoteType, request.getCategorySlug())) {
        throw new RuntimeException("No slots available for this plan.");
      }
    }

    // Crear una nueva promoción en lugar de actualizar promoteType en Article
    ArticlePromotion promotion = new ArticlePromotion();
    promotion.setArticle(article);
    promotion.setPromoteType(promoteType);

    // Como es activatePlan manual, normalmente no tendrá expiración
    // pero si quieres agregar expiración, puedes ponerlo aquí:
    // promotion.setExpirationAt(LocalDateTime.now().plusDays(30));

    article.getPromotions().add(promotion);

    articleRepository.save(article);

    // (Opcional) Si quieres guardar también la promoción explícitamente:
    // articlePromotionRepository.save(promotion);
  }

  @Transactional
  public void cancelSubscription(Long articleId, String planType) {
    Article article = articleRepository.findById(articleId)
      .orElseThrow(() -> new RuntimeException("Article not found"));

    PromoteType promoteType = PromoteType.valueOf(planType);

    article.getPromotions().forEach(promotion -> {
      if (promotion.getPromoteType() == promoteType) {
        promotion.setCancelled(true);
      }
    });

    articleRepository.save(article);
  }




}
