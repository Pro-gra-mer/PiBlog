package com.piblogchain.backend.dto;

import com.piblogchain.backend.enums.PlanType;

public class PaymentCreateRequest {

  private String username;
  private PlanType planType;

  public PaymentCreateRequest() {
  }

  public PaymentCreateRequest(String username, PlanType planType) {
    this.username = username;
    this.planType = planType;
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
}
