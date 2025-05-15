package com.piblogchain.backend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "session_links")
public class SessionLink {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String code; // UUID o código único generado

  @ManyToOne
  @JoinColumn(name = "user_id")
  private User user;

  private LocalDateTime createdAt;

  public SessionLink() {
    this.createdAt = LocalDateTime.now();
  }

  public SessionLink(String code) {
    this.code = code;
    this.createdAt = LocalDateTime.now();
  }

  // Getters y Setters
  public Long getId() { return id; }
  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }
  public LocalDateTime getCreatedAt() { return createdAt; }
}
