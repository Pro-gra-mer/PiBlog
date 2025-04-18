package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.AttachArticleRequest;
import com.piblogchain.backend.dto.PaymentApprovalRequest;
import com.piblogchain.backend.dto.PaymentCompleteRequest;
import com.piblogchain.backend.dto.PaymentCreateRequest;
import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.enums.PlanType;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.models.Category;
import com.piblogchain.backend.models.Payment;
import com.piblogchain.backend.repositories.ArticleRepository;
import com.piblogchain.backend.repositories.CategoryRepository;
import com.piblogchain.backend.repositories.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

  @Value("${pi.api.key}")
  private String piApiKey;

  private final Environment env;
  private final PaymentRepository paymentRepository;
  private final ArticleRepository articleRepository;
  private final CategoryRepository categoryRepository;


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
    System.out.println("Pago guardado: " + savedPayment.getPaymentId() + ", ID: " + savedPayment.id());

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

    // STANDARD no expira, los otros duran 30 días
    if (payment.getPlanType().equals("STANDARD")) {
      payment.setExpirationAt(null);
    } else {
      payment.setExpirationAt(LocalDateTime.now().plusDays(30));
    }

    // Si es STANDARD, crea artículo vacío
    if (payment.getPlanType().equals("STANDARD") && payment.getArticle() == null) {
      Article newArticle = new Article();
      newArticle.setCreatedBy(payment.getUsername());
      newArticle.setStatus(ArticleStatus.DRAFT);
      newArticle.setPublishDate(LocalDate.now());

      // ❗️ Campos mínimos
      newArticle.setApp("");
      newArticle.setCompany("");
      newArticle.setTitle("");
      newArticle.setDescription("");
      newArticle.setContent("");

      // ✅ Asignar categoría "Sin categoría"
      Category defaultCategory = categoryRepository.findBySlug("sin-categoria")
        .orElseThrow(() -> new RuntimeException("Default category not found"));

      newArticle.setCategory(defaultCategory);

      articleRepository.save(newArticle);
      payment.setArticle(newArticle);
    }



    paymentRepository.save(payment);
  }

  public void attachArticleToPayment(AttachArticleRequest request) {
    Payment payment = findPaymentOrThrow(request.getPaymentId());

    Article article = articleRepository.findById(request.getArticleId())
      .orElseThrow(() -> new RuntimeException("Article not found"));

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

}
