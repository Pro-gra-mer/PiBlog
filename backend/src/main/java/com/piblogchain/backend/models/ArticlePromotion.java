package com.piblogchain.backend.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.piblogchain.backend.enums.PromoteType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "article_promotions")
public class ArticlePromotion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JsonBackReference
  @JoinColumn(name = "article_id", nullable = false)
  private Article article;

  @Enumerated(EnumType.STRING)
  private PromoteType promoteType;

  private LocalDateTime expirationAt;

  @Column(nullable = false)
  private boolean cancelled = false;

  // Getters and Setters

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Article getArticle() {
    return article;
  }

  public void setArticle(Article article) {
    this.article = article;
  }

  public PromoteType getPromoteType() {
    return promoteType;
  }

  public void setPromoteType(PromoteType promoteType) {
    this.promoteType = promoteType;
  }

  public LocalDateTime getExpirationAt() {
    return expirationAt;
  }

  public void setExpirationAt(LocalDateTime expirationAt) {
    this.expirationAt = expirationAt;
  }

  public boolean isCancelled() {
    return cancelled;
  }

  public void setCancelled(boolean cancelled) {
    this.cancelled = cancelled;
  }
}
