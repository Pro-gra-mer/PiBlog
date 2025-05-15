package com.piblogchain.backend.repositories;

import com.piblogchain.backend.models.SessionLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface SessionLinkRepository extends JpaRepository<SessionLink, Long> {
  Optional<SessionLink> findByCode(String code);
  void deleteByCode(String code);
  void deleteAllByCreatedAtBefore(LocalDateTime time);

}
