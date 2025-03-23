package com.piblogchain.backend.repositories;

import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByPiId(String piId); // Buscar usuario por Pi ID

  boolean existsByPiId(String piId); // Verificar si ya está registrado
}
