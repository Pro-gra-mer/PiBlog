package com.piblogchain.backend.controllers;

import com.piblogchain.backend.dto.ContactRequest;
import com.piblogchain.backend.services.EmailService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
  private static final Logger logger = LoggerFactory.getLogger(ContactController.class);
  private final EmailService emailService;

  public ContactController(EmailService emailService) {
    this.emailService = emailService;
  }

  @PostMapping
  public ResponseEntity<Map<String, String>> sendMessage(@Valid @RequestBody ContactRequest request) {
    logger.info("Recibida solicitud POST a /api/contact: name={}, email={}, message={}",
      request.getName(), request.getEmail(), request.getMessage());
    try {
      emailService.sendEmail(request);
      logger.info("Correo enviado exitosamente");
      Map<String, String> response = new HashMap<>();
      response.put("message", "Message sent");
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      logger.error("Error al enviar correo: {}", e.getMessage(), e);
      Map<String, String> errorResponse = new HashMap<>();
      errorResponse.put("error", "Error sending message: " + e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
  }
}
