package com.piblogchain.backend.controllers;

import com.cloudinary.Cloudinary;
import com.piblogchain.backend.dto.ArticleDTO;
import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.services.ArticleService;
import com.piblogchain.backend.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class ArticleController {

  private final ArticleService articleService;
  private final Cloudinary cloudinary;

  @Autowired
  public ArticleController(ArticleService articleService, Cloudinary cloudinary) {
    this.articleService = articleService;
    this.cloudinary = cloudinary;
  }

  @PostMapping("/articles")
  @Operation(summary = "Create a new article", security = @SecurityRequirement(name = "BearerAuth"))
  public ResponseEntity<?> createArticle(@Valid @RequestBody ArticleDTO articleDTO) {
    try {
      String username = SecurityContextHolder.getContext().getAuthentication().getName();
      Article savedArticle = articleService.createArticle(articleDTO, username);
      return ResponseEntity.ok(savedArticle);
    } catch (IllegalArgumentException ex) {
      return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    } catch (Exception ex) {
      ex.printStackTrace(); // Imprime el stack trace completo
      return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
    }
  }

  @Operation(summary = "Get all published articles")
  @GetMapping("/articles")
  public ResponseEntity<List<Article>> getPublicPublishedArticles() {
    List<Article> articles = articleService.getArticlesByStatus(ArticleStatus.PUBLISHED);
    return ResponseEntity.ok(articles);
  }

  @Operation(summary = "Get an article by ID")
  @GetMapping("/articles/{id}")
  public ResponseEntity<Article> getArticleById(@PathVariable Long id) {
    return articleService.getArticleById(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PutMapping("/articles/{id}/submit")
  @Operation(summary = "Submit article for review", security = @SecurityRequirement(name = "BearerAuth"))
  public ResponseEntity<?> submitArticle(@PathVariable Long id, Authentication authentication) {
    Optional<Article> optional = articleService.getArticleById(id);
    if (optional.isEmpty()) return ResponseEntity.notFound().build();
    Article article = optional.get();

    System.out.println("auth.getName(): " + authentication.getName());
    System.out.println("article.getCreatedBy(): " + article.getCreatedBy());

    if (!SecurityUtils.isOwnerOrAdmin(authentication, article.getCreatedBy())) {
      return ResponseEntity.status(403).body("No tienes permisos para enviar este artículo.");
    }

    return articleService.submitArticleForReview(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }



  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Approve an article", security = @SecurityRequirement(name = "BearerAuth"))
  @PutMapping("/articles/{id}/approve")
  public ResponseEntity<?> approveArticle(@PathVariable Long id) {
    try {
      return articleService.approveArticle(id)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
    } catch (IllegalStateException ex) {
      return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
  }


  @DeleteMapping("/articles/{id}")
  @Operation(summary = "Delete an article", security = @SecurityRequirement(name = "BearerAuth"))
  public ResponseEntity<?> deleteArticle(@PathVariable Long id, Authentication authentication) {
    Optional<Article> optional = articleService.getArticleById(id);
    if (optional.isEmpty()) return ResponseEntity.notFound().build();

    Article article = optional.get();
    if (!SecurityUtils.isOwnerOrAdmin(authentication, article.getCreatedBy())) {
      return ResponseEntity.status(403).body("No tienes permisos para eliminar este artículo.");
    }

    boolean deleted = articleService.deleteArticle(id);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
  }



  @GetMapping("/articles/drafts")
  @Operation(summary = "Get user's draft articles", security = @SecurityRequirement(name = "BearerAuth"))
  public ResponseEntity<List<Article>> getDrafts() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String username = auth.getName();
    List<Article> drafts = articleService.getDraftsByUser(username);
    return ResponseEntity.ok(drafts);
  }


  @GetMapping("/articles/pending")
  @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
  public ResponseEntity<List<Article>> getPendingArticles() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String username = auth.getName();

    if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
      return ResponseEntity.ok(articleService.getArticlesByStatus(ArticleStatus.PENDING_APPROVAL));
    } else {
      return ResponseEntity.ok(articleService.getPendingArticlesByUser(username));
    }
  }


  @Operation(summary = "Get published articles of the current user", security = @SecurityRequirement(name = "BearerAuth"))
  @GetMapping("/articles/published")
  @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
  public ResponseEntity<List<Article>> getUserPublishedArticles() {
    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    List<Article> articles = articleService.getPublishedArticlesByUser(username);
    return ResponseEntity.ok(articles);
  }

  @Operation(summary = "Delete an image from Cloudinary", security = @SecurityRequirement(name = "BearerAuth"))
  @DeleteMapping("/cleanup/{publicId}")
  public ResponseEntity<String> deleteImage(@PathVariable String publicId) {
    try {
      Map<String, String> options = new HashMap<>();
      Map result = cloudinary.uploader().destroy(publicId, options);
      System.out.println("Resultado de Cloudinary: " + result);

      String deleteResult = (String) result.get("result");
      if ("ok".equals(deleteResult) || "not found".equals(deleteResult)) {
        return ResponseEntity.ok("Imagen eliminada (o ya inexistente) en Cloudinary");
      } else {
        return ResponseEntity.status(400).body("No se pudo eliminar la imagen: " + deleteResult);
      }
    } catch (Exception e) {
      return ResponseEntity.status(500).body("Error al eliminar la imagen: " + e.getMessage());
    }
  }


  @PutMapping("/articles/{id}")
  @Operation(summary = "Update an article", security = @SecurityRequirement(name = "BearerAuth"))
  public ResponseEntity<?> updateArticle(
    @PathVariable Long id,
    @RequestBody ArticleDTO articleDTO,
    Authentication authentication
  ) {
    Optional<Article> optional = articleService.getArticleById(id);
    if (optional.isEmpty()) return ResponseEntity.notFound().build();

    Article article = optional.get();
    if (!SecurityUtils.isOwnerOrAdmin(authentication, article.getCreatedBy())) {
      return ResponseEntity.status(403).body("No tienes permisos para editar este artículo.");
    }

    Optional<Article> updated = articleService.updateArticle(id, articleDTO);
    return updated.map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }


  @DeleteMapping("/cleanup/video/{publicId}")
  public ResponseEntity<Map<String, String>> deleteVideo(@PathVariable String publicId) {
    try {
      Map<String, Object> result = cloudinary.uploader().destroy(
        publicId,
        Map.of("resource_type", "video")
      );

      String deleteResult = (String) result.get("result");

      if ("ok".equals(deleteResult) || "not found".equals(deleteResult)) {
        return ResponseEntity.ok(Map.of("message", "Video eliminado (o ya inexistente)"));
      } else {
        return ResponseEntity.status(400).body(Map.of("error", "No se pudo eliminar el video: " + deleteResult));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500).body(Map.of("error", "Error al eliminar el video: " + e.getMessage()));
    }
  }


  @GetMapping("/articles/category/{slug}")
  public ResponseEntity<List<Article>> getArticlesByCategory(@PathVariable String slug) {
    List<Article> articles = articleService.getArticlesByCategorySlug(slug);
    return ResponseEntity.ok(articles);
  }

  @PutMapping("/articles/{id}/reject")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> rejectArticle(
    @PathVariable Long id,
    @RequestBody Map<String, String> body
  ) {
    String reason = body.get("reason");
    return articleService.rejectArticle(id, reason)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @GetMapping("/articles/rejected")
  @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
  public ResponseEntity<List<Article>> getRejectedArticles() {
    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    List<Article> articles = articleService.getRejectedArticlesByUser(username);
    return ResponseEntity.ok(articles);
  }



}
