package com.piblogchain.backend.controllers;


import com.piblogchain.backend.dto.AttachArticleRequest;
import com.piblogchain.backend.dto.PaymentApprovalRequest;
import com.piblogchain.backend.dto.PaymentCompleteRequest;
import com.piblogchain.backend.dto.PaymentCreateRequest;
import com.piblogchain.backend.models.Payment;
import com.piblogchain.backend.repositories.PaymentRepository;
import com.piblogchain.backend.services.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

  private final PaymentService paymentService;
  private final PaymentRepository paymentRepository;

  public PaymentController(PaymentService paymentService, PaymentRepository paymentRepository) {
    this.paymentService = paymentService;
    this.paymentRepository = paymentRepository;
  }

  @PostMapping("/create")
  public ResponseEntity<?> createPayment(@RequestBody PaymentCreateRequest request) {
    return ResponseEntity.ok(paymentService.createPayment(request));
  }

  @PostMapping("/approve")
  public ResponseEntity<?> approvePayment(@RequestBody PaymentApprovalRequest request) {
    paymentService.approvePayment(request);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/complete")
  public ResponseEntity<?> completePayment(@RequestBody PaymentCompleteRequest request) {
    paymentService.completePayment(request);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/complete-with-article")
  public ResponseEntity<?> completeWithArticle(@RequestBody PaymentCompleteRequest request) {
    paymentService.completePayment(request);
    return ResponseEntity.ok("Payment completed and article associated.");
  }

  @GetMapping("/active-plan")
  public ResponseEntity<?> getActivePlan(
    @RequestParam(required = false) String username,
    @AuthenticationPrincipal(expression = "username") String jwtUsername // solo válido si usas JWT
  ) {
    // Prioriza el username por parámetro (modo dev), pero usa el del JWT si está disponible
    String finalUsername = (username != null) ? username : jwtUsername;
    if (finalUsername == null) {
      return ResponseEntity.badRequest().body("Username is required");
    }

    Map<String, Object> planDetails = paymentService.getActivePlanDetails(finalUsername);
    return ResponseEntity.ok(planDetails);
  }

  @PostMapping("/attach-article")
  public ResponseEntity<?> attachArticleToPayment(@RequestBody AttachArticleRequest request) {
    paymentService.attachArticleToPayment(request);
    return ResponseEntity.ok("Article attached to payment successfully.");
  }

}
