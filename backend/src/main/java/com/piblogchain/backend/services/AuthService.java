package com.piblogchain.backend.services;

import com.piblogchain.backend.models.User;
import com.piblogchain.backend.models.UserRole;
import com.piblogchain.backend.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class AuthService {

  private static final Logger log = LoggerFactory.getLogger(AuthService.class);

  private final UserRepository userRepository;
  private final boolean isProduction;

  public AuthService(
    UserRepository userRepository,
    @Value("${app.production:false}") boolean isProduction
  ) {
    this.userRepository = userRepository;
    this.isProduction = isProduction;
  }

  // Authenticates or registers a user based on Pi ID
  public User authenticateUser(String piId, String username, String email) {
    try {
      if (piId == null || piId.trim().isEmpty()) {
        throw new IllegalArgumentException("Pi ID is required");
      }
      if (username == null || username.trim().isEmpty()) {
        throw new IllegalArgumentException("Username is required");
      }

      Optional<User> existingUser = userRepository.findByPiId(piId);
      if (existingUser.isPresent()) {
        if (!isProduction) {
          log.info("User authenticated with Pi ID: {}", piId);
        }
        return existingUser.get();
      }

      User newUser = new User();
      newUser.setPiId(piId);
      newUser.setUsername(username);
      newUser.setEmail(email != null ? email : "");
      newUser.setRole(UserRole.USER);

      User savedUser = userRepository.save(newUser);
      if (!isProduction) {
        log.info("New user registered with Pi ID: {}", piId);
      }
      return savedUser;
    } catch (Exception e) {
      if (!isProduction) {
        log.error("Failed to authenticate or register user: {}", e.getMessage());
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to authenticate or register user");
    }
  }
}
