package com.piblogchain.backend.dto;

public class PaymentCompleteRequest {
  private String paymentId;
  private String txid;
  private Long articleId; // 👈 nuevo campo opcional

  public PaymentCompleteRequest() {
  }

  public PaymentCompleteRequest(String paymentId, String txid, Long articleId) {
    this.paymentId = paymentId;
    this.txid = txid;
    this.articleId = articleId;
  }

  public String getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(String paymentId) {
    this.paymentId = paymentId;
  }

  public String getTxid() {
    return txid;
  }

  public void setTxid(String txid) {
    this.txid = txid;
  }

  public Long getArticleId() {
    return articleId;
  }

  public void setArticleId(Long articleId) {
    this.articleId = articleId;
  }
}
