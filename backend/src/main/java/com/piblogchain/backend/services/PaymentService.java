package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.AttachArticleRequest;
import com.piblogchain.backend.dto.PaymentApprovalRequest;
import com.piblogchain.backend.dto.PaymentCompleteRequest;
import com.piblogchain.backend.dto.PaymentCreateRequest;
import com.piblogchain.backend.enums.PlanType;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.models.Payment;
import com.piblogchain.backend.repositories.ArticleRepository;
import com.piblogchain.backend.repositories.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

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


  public PaymentService(Environment env, PaymentRepository paymentRepository, ArticleRepository articleRepository) {
    this.env = env;
    this.paymentRepository = paymentRepository;
    this.articleRepository = articleRepository;
  }


  public Map<String, Object> createPayment(PaymentCreateRequest request) {
    double amount = getPlanPrice(request.getPlanType());
    String memo = "Payment for plan: " + request.getPlanType();

    String paymentId = "sandbox-" + System.currentTimeMillis(); // Generar un ID único temporal

    Payment payment = new Payment();
    payment.setPaymentId(paymentId);
    payment.setUsername(request.getUsername());
    payment.setPlanType(request.getPlanType().name());
    payment.setStatus("CREATED");
    payment.setSandbox(env.acceptsProfiles("sandbox"));
    payment.setCreatedAt(LocalDateTime.now());

    paymentRepository.save(payment);

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
    boolean isSandbox = env.acceptsProfiles("sandbox");
    System.out.println("✔ Approved payment: " + request.getPaymentId() + " - Plan: " + request.getPlanType());

    Payment payment = paymentRepository.findById(request.getPaymentId()).orElse(null);
    if (payment != null) {
      payment.setStatus("APPROVED");
      paymentRepository.save(payment);
    }
  }

  public void completePayment(PaymentCompleteRequest request) {
    System.out.println("✅ Completed payment: " + request.getPaymentId() + " - TxID: " + request.getTxid());

    Payment payment = paymentRepository.findById(request.getPaymentId()).orElse(null);
    if (payment != null) {
      payment.setStatus("COMPLETED");
      payment.setTxid(request.getTxid());
      payment.setCompletedAt(LocalDateTime.now());
      payment.setExpirationAt(LocalDateTime.now().plusDays(30)); // ⏳ 30 días de suscripción
      if (request.getArticleId() != null) {
        payment.setArticleId(request.getArticleId()); // 👈 asocia el artículo
      }
      paymentRepository.save(payment);
    }
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

    if (active != null && active.getExpirationAt() != null && active.getExpirationAt().isAfter(LocalDateTime.now())) {
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

  public void attachArticleToPayment(AttachArticleRequest request) {
    String paymentId = String.valueOf(request.getPaymentId());
    Payment payment = paymentRepository.findById(paymentId)
      .orElseThrow(() -> new RuntimeException("Payment not found"));

    Article article = articleRepository.findById(request.getArticleId())
      .orElseThrow(() -> new RuntimeException("Article not found"));

    payment.setArticleId(article.getId());

    paymentRepository.save(payment);
  }

}
