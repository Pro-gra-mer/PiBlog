package com.piblogchain.backend.models;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
public class Payment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String username;
  private String planType;
  private String txid;
  private String status;
  private boolean sandbox;
  private LocalDateTime createdAt;
  private LocalDateTime completedAt;
  private LocalDateTime expirationAt;

  @Column(name = "payment_id", unique = true)
  private String paymentId;


  @OneToOne
  @JoinColumn(name = "article_id")
  private Article article;


  public Payment() {}

  public Long id() {
    return id;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPlanType() {
    return planType;
  }

  public void setPlanType(String planType) {
    this.planType = planType;
  }

  public String getTxid() {
    return txid;
  }

  public void setTxid(String txid) {
    this.txid = txid;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public boolean isSandbox() {
    return sandbox;
  }

  public void setSandbox(boolean sandbox) {
    this.sandbox = sandbox;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getCompletedAt() {
    return completedAt;
  }

  public void setCompletedAt(LocalDateTime completedAt) {
    this.completedAt = completedAt;
  }

  public LocalDateTime getExpirationAt() {
    return expirationAt;
  }

  public void setExpirationAt(LocalDateTime expirationAt) {
    this.expirationAt = expirationAt;
  }

  public Article getArticle() {
    return article;
  }

  public void setArticle(Article article) {
    this.article = article;
  }

  public String getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(String paymentId) {
    this.paymentId = paymentId;
  }

}
