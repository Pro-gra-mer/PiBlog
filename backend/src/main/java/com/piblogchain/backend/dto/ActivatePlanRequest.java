package com.piblogchain.backend.dto;

public class ActivatePlanRequest {
  private Long articleId;
  private String planType;
  private String username;
  private String categorySlug;

  public ActivatePlanRequest() {
  }

  public Long getArticleId() {
    return articleId;
  }

  public void setArticleId(Long articleId) {
    this.articleId = articleId;
  }

  public String getPlanType() {
    return planType;
  }

  public void setPlanType(String planType) {
    this.planType = planType;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getCategorySlug() {
    return categorySlug;
  }

  public void setCategorySlug(String categorySlug) {
    this.categorySlug = categorySlug;
  }
}
