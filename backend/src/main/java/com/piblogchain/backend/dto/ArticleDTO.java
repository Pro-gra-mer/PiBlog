package com.piblogchain.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class ArticleDTO {

  @NotBlank(message = "Company is required")
  @Schema(description = "Name of the company", example = "TechCorp", required = true)
  private String company;

  @NotBlank(message = "App name is required")
  @Schema(description = "Name of the app", example = "AppName", required = true)
  private String app;

  @NotBlank(message = "Title is required")
  @Size(max = 100, message = "Title must not exceed 100 characters")
  @Schema(description = "Title of the article", example = "An Amazing Article", required = true)
  private String title;

  @NotBlank(message = "Category is required")
  @Schema(description = "Category of the article", example = "Productivity Tools", required = true)
  private String category;

  @NotBlank(message = "Content is required")
  @Schema(description = "Content of the article", example = "This article explains...", required = true)
  private String content;

  @NotNull(message = "Publish date is required")
  @Schema(description = "Publication date of the article", example = "2025-03-16", required = true)
  private LocalDate publishDate;

  @Schema(description = "Indicates if the video should be promoted", example = "true")
  private boolean promoteVideo;

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
}
