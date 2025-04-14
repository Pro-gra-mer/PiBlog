package com.piblogchain.backend.dto;

public class AttachArticleRequest {
  private Long paymentId;
  private Long articleId;


  public AttachArticleRequest() {
  }

  public AttachArticleRequest(Long paymentId, Long articleId) {
    this.paymentId = paymentId;
    this.articleId = articleId;
  }

  public Long getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(Long paymentId) {
    this.paymentId = paymentId;
  }

  public Long getArticleId() {
    return articleId;
  }

  public void setArticleId(Long articleId) {
    this.articleId = articleId;
  }
// getters y setters
}
