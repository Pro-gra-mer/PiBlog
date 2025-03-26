package com.piblogchain.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CategoryDTO {

  @NotBlank(message = "Category name is required")
  private String name;

  public CategoryDTO() {}

  public CategoryDTO(String name) {
    this.name = name;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }
}
