package com.piblogchain.backend.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import io.swagger.v3.oas.annotations.media.Schema;

@Entity
@Table(name = "articles")
public class Article {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Schema(description = "Unique identifier of the article", example = "1", required = true)
  private Long id;

  @Column(nullable = false)
  @Schema(description = "Name of the company", example = "TechCorp", required = true)
  private String company;

  @Column(nullable = false)
  @Schema(description = "Name of the app", example = "AppName", required = true)
  private String app;

  @Column(nullable = false, length = 100)
  @Schema(description = "Title of the article", example = "An Amazing Article", required = true)
  private String title;

  @Column(nullable = false)
  @Schema(description = "Category of the article", example = "Productivity Tools", required = true)
  private String category;

  @Lob
  @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
  @Schema(description = "Content of the article", example = "This article explains...", required = true)
  private String content;

  @Column(nullable = false)
  @Schema(description = "Publication date of the article", example = "2025-03-16", required = true)
  private LocalDate publishDate;

  @Column(nullable = false)
  @Schema(description = "Indicates if the video should be promoted in the slider", example = "true", required = true)
  private boolean promoteVideo;

  @Column(nullable = false)
  @Schema(description = "Indicates if the article is approved and published", example = "false", required = true)
  private boolean approved;

  // Constructor vacío
  public Article() {}

  // Constructor completo (exceptuando el id autogenerado)
  public Article(String company, String app, String title, String category, String content, LocalDate publishDate, boolean promoteVideo, boolean approved) {
    this.company = company;
    this.app = app;
    this.title = title;
    this.category = category;
    this.content = content;
    this.publishDate = publishDate;
    this.promoteVideo = promoteVideo;
    this.approved = approved;
  }

  // Getters y Setters
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getCompany() {
    return company;
  }

  public void setCompany(String company) {
    this.company = company;
  }

  public String getApp() {
    return app;
  }

  public void setApp(String app) {
    this.app = app;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public LocalDate getPublishDate() {
    return publishDate;
  }

  public void setPublishDate(LocalDate publishDate) {
    this.publishDate = publishDate;
  }

  public boolean isPromoteVideo() {
    return promoteVideo;
  }

  public void setPromoteVideo(boolean promoteVideo) {
    this.promoteVideo = promoteVideo;
  }

  public boolean isApproved() {
    return approved;
  }

  public void setApproved(boolean approved) {
    this.approved = approved;
  }
}
