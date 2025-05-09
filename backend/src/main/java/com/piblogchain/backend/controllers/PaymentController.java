package com.piblogchain.backend.controllers;


import com.piblogchain.backend.dto.*;
import com.piblogchain.backend.enums.PromoteType;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.models.ArticlePromotion;
import com.piblogchain.backend.models.Payment;
import com.piblogchain.backend.repositories.ArticleRepository;
import com.piblogchain.backend.repositories.PaymentRepository;
import com.piblogchain.backend.services.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

  private final PaymentService paymentService;
  private final PaymentRepository paymentRepository;
  private final ArticleRepository articleRepository;


  public PaymentController(PaymentService paymentService, PaymentRepository paymentRepository, ArticleRepository articleRepository) {
    this.paymentService = paymentService;
    this.paymentRepository = paymentRepository;
    this.articleRepository = articleRepository;
  }

  @PostMapping("/create")
  public ResponseEntity<?> createPayment(@RequestBody PaymentCreateRequest request) {
    return ResponseEntity.ok(paymentService.createPayment(request));
  }

  @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
  @PostMapping("/approve")
  public ResponseEntity<?> approvePayment(@RequestBody PaymentApprovalRequest request) {
    paymentService.approvePayment(request);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/complete")
  public ResponseEntity<Map<String, Object>> completePayment(@RequestBody PaymentCompleteRequest request) {
    paymentService.completePayment(request);

    Payment payment = paymentService.getByPaymentId(request.getPaymentId());

    Map<String, Object> response = new HashMap<>();
    response.put("message", "Payment completed successfully");

    if (payment.getArticle() != null) {
      response.put("articleId", payment.getArticle().getId());
    }

    return ResponseEntity.ok(response);
  }



  @PostMapping("/complete-with-article")
  public ResponseEntity<?> completeWithArticle(@RequestBody PaymentCompleteRequest request) {
    paymentService.completePayment(request);
    return ResponseEntity.ok("Payment completed and article associated.");
  }

  @GetMapping("/active-plan")
  public ResponseEntity<?> getActivePlan(
    @RequestParam(required = false) String username,
    @AuthenticationPrincipal String principal

  ) {
    String finalUsername = (username != null) ? username : principal;

    if (finalUsername == null) {
      return ResponseEntity.badRequest().body("Username is required");
    }

    Map<String, Object> planDetails = paymentService.getActivePlanDetails(finalUsername);
    return ResponseEntity.ok(planDetails);
  }

  @PostMapping("/attach-article")
  public ResponseEntity<?> attachArticleToPayment(
    @RequestParam String paymentId,
    @RequestParam Long articleId
  ) {
    paymentService.attachArticleToPayment(paymentId, articleId);
    return ResponseEntity.ok("Article attached to payment successfully.");
  }

  @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
  @GetMapping("/by-article/{articleId}")
  public ResponseEntity<?> getPaymentByArticleId(@PathVariable Long articleId) {
    return ResponseEntity.ok(paymentService.getPaymentByArticleId(articleId));
  }

  @GetMapping("/slots")
  public ResponseEntity<Map<String, Object>> getSlotInfo(
    @RequestParam PromoteType promoteType,
    @RequestParam(required = false) String categorySlug
  ) {
    Map<String, Object> availability = paymentService.getSlotAvailability(promoteType, categorySlug);
    return ResponseEntity.ok(availability);
  }

  @PostMapping("/activate")
  @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
  public ResponseEntity<?> activatePlan(@RequestBody ActivatePlanRequest request) {
    return ResponseEntity.ok(paymentService.activatePlan(request));
  }


  @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
  @DeleteMapping("/cancel-subscription")
  public ResponseEntity<?> cancelSubscription(
    @RequestParam Long articleId,
    @RequestParam String planType
  ) {
    paymentService.cancelSubscription(articleId, planType);
    return ResponseEntity.ok("Subscription cancelled successfully.");
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/activate/admin")
  public ResponseEntity<?> activatePlanAsAdmin(@RequestBody ActivatePlanRequest request) {
    try {
      paymentService.activateWithoutPayment(request);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body("Error activating plan as admin");
    }
  }

  @RestController
  @RequestMapping("/api/price")
  public class PiPriceController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping
    public Map<String, Object> getPlanPricesInUsd() {
      return paymentService.getPlanPricesInUsd();
    }
  }



}
