package com.piblogchain.backend.utils;

import com.piblogchain.backend.enums.PaymentStatus;
import com.piblogchain.backend.models.Payment;
import com.piblogchain.backend.repositories.PaymentRepository;
import com.piblogchain.backend.repositories.SessionLinkRepository;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class SessionCleanupTask {

  private final SessionLinkRepository sessionLinkRepository;
  private final PaymentRepository paymentRepository;

  public SessionCleanupTask(SessionLinkRepository sessionLinkRepository,
                            PaymentRepository paymentRepository) {
    this.sessionLinkRepository = sessionLinkRepository;
    this.paymentRepository = paymentRepository;
  }

  @Scheduled(fixedRate = 5 * 60 * 1000) // cada 5 minutos
  @Transactional
  public void removeExpiredSessionLinksAndPendingPayments() {
    LocalDateTime cutoff = LocalDateTime.now().minusMinutes(10);

    // Elimina session links antiguos
    sessionLinkRepository.deleteAllByCreatedAtBefore(cutoff);

    // Elimina pagos CREATED sin artículo y antiguos
    List<Payment> orphanedPayments = paymentRepository
      .findByArticleIsNullAndStatusAndCreatedAtBefore(PaymentStatus.CREATED, cutoff);

    paymentRepository.deleteAll(orphanedPayments);
  }
}
