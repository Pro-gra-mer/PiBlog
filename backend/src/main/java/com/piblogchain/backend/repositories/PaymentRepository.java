package com.piblogchain.backend.repositories;

import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.models.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
  Payment findTopByUsernameAndStatusOrderByCompletedAtDesc(String username, String status);

  Optional<Payment> findByPaymentId(String paymentId);
  Optional<Payment> findByArticle(Article article);



}
