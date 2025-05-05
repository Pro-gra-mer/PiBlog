package com.piblogchain.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CategoryDTO {

  @NotBlank(message = "Category name is required")
  private String name;

  @NotBlank(message = "Category slug is required")
  private String slug;

  private String description;
  private String emoji;
  private String headerImage;


  public CategoryDTO() {}

  public CategoryDTO(String name, String slug) {
    this.name = name;
    this.slug = slug;
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

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getEmoji() {
    return emoji;
  }

  public void setEmoji(String emoji) {
    this.emoji = emoji;
  }

  public String getHeaderImage() {
    return headerImage;
  }

  public void setHeaderImage(String headerImage) {
    this.headerImage = headerImage;
  }
}

