package com.piblogchain.backend.controllers;

import com.piblogchain.backend.models.User;
import com.piblogchain.backend.services.SessionLinkService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/session-links")
public class SessionLinkController {

  private final SessionLinkService sessionLinkService;

  @Autowired
  public SessionLinkController(SessionLinkService sessionLinkService) {
    this.sessionLinkService = sessionLinkService;
  }

  @PostMapping
  public ResponseEntity<Map<String, String>> createSessionLink() {
    String code = sessionLinkService.createSessionCode();
    return ResponseEntity.ok(Map.of("code", code));
  }

  @PostMapping("/sync")
  public ResponseEntity<?> syncSession(@RequestBody Map<String, String> body, Principal principal) {
    String code = body.get("code");
    String piId = principal.getName();

    if (code == null || piId == null) {
      return ResponseEntity.badRequest().body("Code or user not found");
    }

    boolean success = sessionLinkService.syncSession(code, piId);
    return success ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
  }


  @GetMapping("/status/{code}")
  public ResponseEntity<?> getStatus(@PathVariable String code) {
    Optional<User> user = sessionLinkService.getUserByCode(code);
    return user.map(u -> ResponseEntity.ok(Map.of("username", u.getUsername())))
      .orElseGet(() -> ResponseEntity.noContent().build());
  }
}
