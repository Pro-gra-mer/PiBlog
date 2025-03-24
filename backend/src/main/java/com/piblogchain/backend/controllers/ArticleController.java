package com.piblogchain.backend.controllers;

import com.cloudinary.Cloudinary;
import com.piblogchain.backend.dto.ArticleDTO;
import com.piblogchain.backend.enums.ArticleStatus;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.services.ArticleService;
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
      return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
    }
  }



  @Operation(summary = "Get all articles")
  @GetMapping("/articles")
  public ResponseEntity<List<Article>> getAllArticles() {
    List<Article> articles = articleService.getAllArticles();
    return ResponseEntity.ok(articles);
  }

  @Operation(summary = "Get an article by ID")
  @GetMapping("/articles/{id}")
  public ResponseEntity<Article> getArticleById(@PathVariable Long id) {
    return articleService.getArticleById(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @Operation(summary = "Submit article for review", security = @SecurityRequirement(name = "BearerAuth"))
  @PutMapping("/articles/{id}/submit")
  public ResponseEntity<Article> submitArticle(@PathVariable Long id) {
    return articleService.submitArticleForReview(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

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


  @Operation(summary = "Delete an article", security = @SecurityRequirement(name = "BearerAuth"))
  @DeleteMapping("/articles/{id}")
  public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
    if (articleService.deleteArticle(id)) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/articles/drafts")
  @Operation(summary = "Get user's draft articles", security = @SecurityRequirement(name = "BearerAuth"))
  public ResponseEntity<List<Article>> getDrafts() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String username = auth.getName();
    List<Article> drafts = articleService.getDraftsByUser(username);
    return ResponseEntity.ok(drafts);
  }


  @Operation(summary = "Get all pending approval articles", security = @SecurityRequirement(name = "BearerAuth"))
  @GetMapping("/articles/pending")
  public ResponseEntity<List<Article>> getPendingArticles() {
    List<Article> pending = articleService.getArticlesByStatus(ArticleStatus.PENDING_APPROVAL);
    return ResponseEntity.ok(pending);
  }

  @Operation(summary = "Get published articles of the current user", security = @SecurityRequirement(name = "BearerAuth"))
  @GetMapping("/articles/published")
  public ResponseEntity<List<Article>> getPublishedArticles() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String username = auth.getName();
    List<Article> published = articleService.getPublishedArticlesByUser(username);
    return ResponseEntity.ok(published);
  }


  @Operation(summary = "Delete an image from Cloudinary", security = @SecurityRequirement(name = "BearerAuth"))
  @DeleteMapping("/cleanup/{publicId}")
  public ResponseEntity<String> deleteImage(@PathVariable String publicId) {
    try {
      Map<String, String> options = new HashMap<>();
      Map result = cloudinary.uploader().destroy(publicId, options);
      System.out.println("Resultado de Cloudinary: " + result);
      if ("ok".equals(result.get("result"))) {
        return ResponseEntity.ok("Imagen eliminada con éxito de Cloudinary");
      } else {
        return ResponseEntity.status(400).body("No se pudo eliminar la imagen: " + result.get("result"));
      }
    } catch (Exception e) {
      return ResponseEntity.status(500).body("Error al eliminar la imagen: " + e.getMessage());
    }
  }

  @PutMapping("/articles/{id}")
  @Operation(summary = "Update an article", security = @SecurityRequirement(name = "BearerAuth"))
  public ResponseEntity<Article> updateArticle(
    @PathVariable Long id,
    @RequestBody ArticleDTO articleDTO
  ) {
    Optional<Article> updatedArticle = articleService.updateArticle(id, articleDTO);
    return updatedArticle.map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }






}
