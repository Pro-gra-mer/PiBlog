package com.piblogchain.backend.controllers;

import com.piblogchain.backend.models.User;
import com.piblogchain.backend.services.AuthService;
import com.piblogchain.backend.utils.PiNetworkValidator;
import com.piblogchain.backend.utils.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;
  private final PiNetworkValidator piNetworkValidator;

  public AuthController(AuthService authService, PiNetworkValidator piNetworkValidator) {
    this.authService = authService;
    this.piNetworkValidator = piNetworkValidator;
  }

  @PostMapping("/pi-login")
  public ResponseEntity<?> piLogin(@RequestParam String accessToken, @RequestParam String piId, @RequestParam String username, @RequestParam(required = false) String email) {
    // Validar el token con Pi Network
    boolean isValid = piNetworkValidator.validateAccessToken(accessToken, piId);

    if (!isValid) {
      return ResponseEntity.status(401).body("Invalid access token");
    }

    // Autenticar al usuario
    User authenticatedUser = authService.authenticateUser(piId, username, email);

    // Generar JWT
    String jwt = JwtUtil.generateToken(authenticatedUser.getPiId(), authenticatedUser.getRole().name());

    return ResponseEntity.ok(jwt);
  }
}
