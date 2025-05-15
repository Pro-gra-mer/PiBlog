package com.piblogchain.backend.repositories;

import com.piblogchain.backend.enums.PaymentStatus;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.models.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
  Payment findTopByUsernameAndStatusOrderByCompletedAtDesc(String username, PaymentStatus status);

  Optional<Payment> findByPaymentId(String paymentId);
  List<Payment> findByArticle(Article article);

  List<Payment> findByArticleId(Long articleId);

  Payment findTopByArticleAndStatusOrderByExpirationAtDesc(Article article, PaymentStatus status);

  List<Payment> findByArticleIsNullAndStatusAndCreatedAtBefore(PaymentStatus status, LocalDateTime before);


}
