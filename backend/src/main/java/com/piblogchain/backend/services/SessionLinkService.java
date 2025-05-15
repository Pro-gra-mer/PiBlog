package com.piblogchain.backend.services;

import com.piblogchain.backend.models.SessionLink;
import com.piblogchain.backend.models.User;
import com.piblogchain.backend.repositories.SessionLinkRepository;
import com.piblogchain.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionLinkService {

  private final SessionLinkRepository sessionLinkRepository;
  private final UserRepository userRepository;
  private final SimpMessagingTemplate messagingTemplate;

  @Autowired
  public SessionLinkService(
    SessionLinkRepository sessionLinkRepository,
    UserRepository userRepository,
    SimpMessagingTemplate messagingTemplate
  ) {
    this.sessionLinkRepository = sessionLinkRepository;
    this.userRepository = userRepository;
    this.messagingTemplate = messagingTemplate;
  }

  public String createSessionCode() {
    String code = UUID.randomUUID().toString();
    sessionLinkRepository.save(new SessionLink(code));
    return code;
  }

  public boolean syncSession(String code, String piId) {
    Optional<SessionLink> optionalLink = sessionLinkRepository.findByCode(code);
    Optional<User> optionalUser = userRepository.findByPiId(piId);

    if (optionalLink.isPresent() && optionalUser.isPresent()) {
      SessionLink link = optionalLink.get();
      link.setUser(optionalUser.get());
      sessionLinkRepository.save(link);

      // Enviar notificación por WebSocket al navegador
      messagingTemplate.convertAndSend("/topic/session/" + code, optionalUser.get().getUsername());

      return true;
    }
    return false;
  }

  public Optional<User> getUserByCode(String code) {
    return sessionLinkRepository.findByCode(code).map(SessionLink::getUser);
  }


}
