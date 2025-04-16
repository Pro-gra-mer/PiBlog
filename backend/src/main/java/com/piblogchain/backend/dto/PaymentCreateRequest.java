package com.piblogchain.backend.dto;

import com.piblogchain.backend.enums.PlanType;

public class PaymentCreateRequest {

  private String username;
  private PlanType planType;
  private String paymentId; // ✅ nuevo campo

  public PaymentCreateRequest() {
  }

  public PaymentCreateRequest(String username, PlanType planType, String paymentId) {
    this.username = username;
    this.planType = planType;
    this.paymentId = paymentId;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public PlanType getPlanType() {
    return planType;
  }

  public void setPlanType(PlanType planType) {
    this.planType = planType;
  }

  public String getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(String paymentId) {
    this.paymentId = paymentId;
  }
}
