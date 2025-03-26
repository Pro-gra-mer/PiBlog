package com.piblogchain.backend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "categories")
public class Category {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String name;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(name = "created_at")
  private LocalDateTime createdAt = LocalDateTime.now();

  public Category() {
    // necesario para JPA
  }

  public Category(String name) {
    this.name = name;
    this.slug = generateSlug(name);
    this.createdAt = LocalDateTime.now();
  }

  public Category(String name, String slug) {
    this.name = name;
    this.slug = slug;
    this.createdAt = LocalDateTime.now();
  }

  private String generateSlug(String name) {
    return name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("-+$", "");
  }


  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
