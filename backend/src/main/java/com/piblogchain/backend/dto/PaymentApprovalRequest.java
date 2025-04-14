package com.piblogchain.backend.dto;

import com.piblogchain.backend.enums.PlanType;

public class PaymentApprovalRequest {

  private String paymentId;
  private PlanType planType;

  public PaymentApprovalRequest() {
  }

  public PaymentApprovalRequest(String paymentId, PlanType planType) {
    this.paymentId = paymentId;
    this.planType = planType;
  }

  public String getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(String paymentId) {
    this.paymentId = paymentId;
  }

  public PlanType getPlanType() {
    return planType;
  }

  public void setPlanType(PlanType planType) {
    this.planType = planType;
  }
}
