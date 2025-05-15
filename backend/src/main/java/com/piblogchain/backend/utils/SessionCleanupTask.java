package com.piblogchain.backend.utils;

import com.piblogchain.backend.repositories.SessionLinkRepository;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class SessionCleanupTask {

  private final SessionLinkRepository sessionLinkRepository;

  public SessionCleanupTask(SessionLinkRepository sessionLinkRepository) {
    this.sessionLinkRepository = sessionLinkRepository;
  }

  @Scheduled(fixedRate = 5 * 60 * 1000) // cada 5 minutos
  @Transactional
  public void removeExpiredSessionLinks() {
    LocalDateTime cutoff = LocalDateTime.now().minusMinutes(10);
    sessionLinkRepository.deleteAllByCreatedAtBefore(cutoff);
  }
}
