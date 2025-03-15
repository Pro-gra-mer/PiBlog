package com.piblogchain.backend.dto;

public class PiLoginRequest {
  private String accessToken;
  private String piId;
  private String username;
  private String email; // Opcional

  // Constructor vacío (Spring lo necesita)
  public PiLoginRequest() {}

  // Getters y Setters
  public String getAccessToken() {
    return accessToken;
  }

  public void setAccessToken(String accessToken) {
    this.accessToken = accessToken;
  }

  public String getPiId() {
    return piId;
  }

  public void setPiId(String piId) {
    this.piId = piId;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }
}
