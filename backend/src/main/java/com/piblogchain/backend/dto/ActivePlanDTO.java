package com.piblogchain.backend.dto;

import java.time.LocalDateTime;

public class ActivePlanDTO {
  private String planType;
  private LocalDateTime expirationAt;
  private boolean cancelled; // ✅ nuevo campo

  public ActivePlanDTO() {}

  public ActivePlanDTO(String planType, LocalDateTime expirationAt, boolean cancelled) {
    this.planType = planType;
    this.expirationAt = expirationAt;
    this.cancelled = cancelled;
  }

  public String getPlanType() {
    return planType;
  }

  public void setPlanType(String planType) {
    this.planType = planType;
  }

  public LocalDateTime getExpirationAt() {
    return expirationAt;
  }

  public void setExpirationAt(LocalDateTime expirationAt) {
    this.expirationAt = expirationAt;
  }

  public boolean isCancelled() {
    return cancelled;
  }

  public void setCancelled(boolean cancelled) {
    this.cancelled = cancelled;
  }
}
