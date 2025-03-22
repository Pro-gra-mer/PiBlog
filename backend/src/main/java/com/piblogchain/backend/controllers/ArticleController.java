package com.piblogchain.backend.controllers;

import com.cloudinary.Cloudinary;
import com.piblogchain.backend.dto.ArticleDTO;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.services.ArticleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

  @Operation(summary = "Create a new article", security = @SecurityRequirement(name = "BearerAuth"))
  @PostMapping("/articles")
  public ResponseEntity<Article> createArticle(@Valid @RequestBody ArticleDTO articleDTO) {
    Article savedArticle = articleService.createArticle(articleDTO);
    return ResponseEntity.ok(savedArticle);
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

  @Operation(summary = "Approve an article", security = @SecurityRequirement(name = "BearerAuth"))
  @PutMapping("/articles/{id}/approve")
  public ResponseEntity<Article> approveArticle(@PathVariable Long id) {
    return articleService.approveArticle(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
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
}
