package com.piblogchain.backend.dto;

public class AttachArticleRequest {
  private String paymentId;
  private Long articleId;

  // Getters y setters
  public String getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(String paymentId) {
    this.paymentId = paymentId;
  }

  public Long getArticleId() {
    return articleId;
  }

  public void setArticleId(Long articleId) {
    this.articleId = articleId;
  }
}

