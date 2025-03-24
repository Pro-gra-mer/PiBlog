package com.piblogchain.backend.dto;

import com.piblogchain.backend.enums.ArticleStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ArticleDTO {

  @NotBlank(message = "Company is required")
  @Schema(description = "Name of the company", example = "TechCorp")
  private String company;

  @NotBlank(message = "App name is required")
  @Schema(description = "Name of the app", example = "AppName")
  private String app;

  @NotBlank(message = "Title is required")
  @Size(max = 100, message = "Title must not exceed 100 characters")
  @Schema(description = "Title of the article", example = "An Amazing Article")
  private String title;

  @NotBlank(message = "Description is required")
  @Schema(
    description = "Brief description of the article for SEO and summary",
    example = "This article explains the benefits of using Cloudinary for media uploads.")
  private String description;

  @Schema(
    description = "URL of the header image for the article",
    example = "https://res.cloudinary.com/dl7on9tjj/image/upload/v1742237037/xdfa4mb0d22ydyxzyvfu.jpg")
  private String headerImage;

  @Schema(
    description = "Public ID of the header image in Cloudinary",
    example = "xkz12abc")
  private String headerImagePublicId;

  @Schema(
    description = "Upload date of the header image",
    example = "2025-03-16T12:34:56")
  private LocalDateTime headerImageUploadDate;

  @NotBlank(message = "Category is required")
  @Schema(description = "Category of the article", example = "Productivity Tools")
  private String category;

  @NotBlank(message = "Content is required")
  @Schema(description = "Content of the article", example = "This article explains...")
  private String content;

  @NotNull(message = "Publish date is required")
  @Schema(description = "Publication date of the article", example = "2025-03-16")
  private LocalDate publishDate;

  @Schema(description = "Indicates if the video should be promoted", example = "true")
  private boolean promoteVideo;

  @Schema(description = "Status of the article", example = "DRAFT")
  private ArticleStatus status;

  @Schema(description = "Username of the article creator", example = "rebeca")
  private String createdBy;

  // Constructor vacío
  public ArticleDTO() {}

  // Constructor completo (opcional)
  public ArticleDTO(String company, String app, String title, String description, String headerImage,
                    String headerImagePublicId, LocalDateTime headerImageUploadDate, String category,
                    String content, LocalDate publishDate, boolean promoteVideo, ArticleStatus status, String createdBy) {
    this.company = company;
    this.app = app;
    this.title = title;
    this.description = description;
    this.headerImage = headerImage;
    this.headerImagePublicId = headerImagePublicId;
    this.headerImageUploadDate = headerImageUploadDate;
    this.category = category;
    this.content = content;
    this.publishDate = publishDate;
    this.promoteVideo = promoteVideo;
    this.status = status;
    this.createdBy = createdBy;
  }

  // Getters y Setters
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

  public String getHeaderImagePublicId() {
    return headerImagePublicId;
  }

  public void setHeaderImagePublicId(String headerImagePublicId) {
    this.headerImagePublicId = headerImagePublicId;
  }

  public LocalDateTime getHeaderImageUploadDate() {
    return headerImageUploadDate;
  }

  public void setHeaderImageUploadDate(LocalDateTime headerImageUploadDate) {
    this.headerImageUploadDate = headerImageUploadDate;
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

  public ArticleStatus getStatus() {
    return status;
  }

  public void setStatus(ArticleStatus status) {
    this.status = status;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(String createdBy) {
    this.createdBy = createdBy;
  }
}
