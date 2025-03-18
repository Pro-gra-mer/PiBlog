package com.piblogchain.backend.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import io.swagger.v3.oas.annotations.media.Schema;

@Entity
@Table(name = "articles")
public class Article {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Schema(description = "Unique identifier of the article", example = "1")
  private Long id;

  @Column(nullable = false)
  @Schema(description = "Name of the company", example = "TechCorp")
  private String company;

  @Column(nullable = false)
  @Schema(description = "Name of the app", example = "AppName")
  private String app;

  @Column(nullable = false, length = 100)
  @Schema(description = "Title of the article", example = "An Amazing Article")
  private String title;

  @Column(nullable = false, columnDefinition = "TEXT")
  @Schema(description = "Brief description of the article for SEO and summary",
    example = "This article explains the benefits of using Cloudinary for media uploads.")
  private String description;

  @Column(name = "header_image")
  @Schema(description = "URL of the header image for the article",
    example = "https://res.cloudinary.com/dl7on9tjj/image/upload/v1742237037/xdfa4mb0d22ydyxzyvfu.jpg")
  private String headerImage;

  @Column(nullable = false)
  @Schema(description = "Category of the article", example = "Productivity Tools")
  private String category;

  @Lob
  @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
  @Schema(description = "Content of the article", example = "This article explains...")
  private String content;

  @Column(nullable = false)
  @Schema(description = "Publication date of the article", example = "2025-03-16")
  private LocalDate publishDate;

  @Column(nullable = false)
  @Schema(description = "Indicates if the video should be promoted in the slider", example = "true")
  private boolean promoteVideo;

  @Column(nullable = false)
  @Schema(description = "Indicates if the article is approved and published", example = "false")
  private boolean approved;

  // Constructor vacío
  public Article() {}

  // Constructor completo (exceptuando el id autogenerado)
  public Article(String company, String app, String title, String description, String headerImage, String category, String content, LocalDate publishDate, boolean promoteVideo, boolean approved) {
    this.company = company;
    this.app = app;
    this.title = title;
    this.description = description;
    this.headerImage = headerImage;
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

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getHeaderImage() {
    return headerImage;
  }

  public void setHeaderImage(String headerImage) {
    this.headerImage = headerImage;
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
