package com.piblogchain.backend.controllers;

import com.piblogchain.backend.dto.ArticleDTO;
import com.piblogchain.backend.models.Article;
import com.piblogchain.backend.services.ArticleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

  private final ArticleService articleService;

  @Autowired
  public ArticleController(ArticleService articleService) {
    this.articleService = articleService;
  }

  @Operation(summary = "Create a new article", security = @SecurityRequirement(name = "BearerAuth"))
  @PostMapping
  public ResponseEntity<Article> createArticle(@Valid @RequestBody ArticleDTO articleDTO) {
    Article savedArticle = articleService.createArticle(articleDTO);
    return ResponseEntity.ok(savedArticle);
  }

  @Operation(summary = "Get all articles", security = @SecurityRequirement(name = "BearerAuth"))
  @GetMapping
  public ResponseEntity<List<Article>> getAllArticles() {
    List<Article> articles = articleService.getAllArticles();
    return ResponseEntity.ok(articles);
  }

  @Operation(summary = "Get an article by ID", security = @SecurityRequirement(name = "BearerAuth"))
  @GetMapping("/{id}")
  public ResponseEntity<Article> getArticleById(@PathVariable Long id) {
    return articleService.getArticleById(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @Operation(summary = "Approve an article", security = @SecurityRequirement(name = "BearerAuth"))
  @PutMapping("/{id}/approve")
  public ResponseEntity<Article> approveArticle(@PathVariable Long id) {
    return articleService.approveArticle(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @Operation(summary = "Delete an article", security = @SecurityRequirement(name = "BearerAuth"))
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
    if (articleService.deleteArticle(id)) {
      return ResponseEntity.noContent().build();
    } else {
      return ResponseEntity.notFound().build();
    }
  }
}
