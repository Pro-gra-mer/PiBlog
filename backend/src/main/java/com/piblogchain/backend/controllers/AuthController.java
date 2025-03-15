package com.piblogchain.backend.controllers;

import com.piblogchain.backend.dto.PiLoginRequest;
import com.piblogchain.backend.models.User;
import com.piblogchain.backend.services.AuthService;
import com.piblogchain.backend.utils.PiNetworkValidator;
import org.springframework.http.HttpStatus;
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
  public ResponseEntity<?> piLogin(@RequestBody PiLoginRequest request) {
    System.out.println("🔍 AccessToken recibido: " + request.getAccessToken());
    System.out.println("👤 Usuario recibido: " + request.getUsername());
    System.out.println("🆔 PiId recibido: " + request.getPiId());

    if (request.getAccessToken() == null || request.getUsername() == null) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Faltan datos en la autenticación");
    }

    // Validar el token con PiNetworkValidator
    boolean isValid = piNetworkValidator.validateAccessToken(request.getAccessToken());

    if (!isValid) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid access token");
    }

    // Autenticar al usuario (piId es opcional en sandbox)
    User authenticatedUser = authService.authenticateUser(
      request.getPiId() != null ? request.getPiId() : "",
      request.getUsername(),
      request.getEmail()
    );

    return ResponseEntity.ok(authenticatedUser);
  }
}
