package com.piblogchain.backend.services;

import com.piblogchain.backend.models.User;
import com.piblogchain.backend.models.UserRole;
import com.piblogchain.backend.repositories.UserRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {

  private final UserRepository userRepository;

  public AuthService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public User authenticateUser(String piId, String username, String email) {
    Optional<User> existingUser = userRepository.findByPiId(piId);

    if (existingUser.isPresent()) {
      return existingUser.get(); // Usuario ya registrado, devolverlo
    } else {
      // Nuevo usuario, lo registramos
      User newUser = new User();
      newUser.setPiId(piId);
      newUser.setUsername(username);
      newUser.setEmail(email);
      newUser.setRole(UserRole.USER); // Por defecto, un usuario normal
      return userRepository.save(newUser);
    }
  }
}

