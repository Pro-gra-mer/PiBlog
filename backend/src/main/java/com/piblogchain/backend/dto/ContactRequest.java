package com.piblogchain.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ContactRequest {
  @NotBlank(message = "Name is required")
  @Size(min = 3, message = "Name must be at least 3 characters")
  private String name;

  @NotBlank(message = "Email is required")
  @Email(message = "Invalid email format")
  private String email;

  @NotBlank(message = "Message is required")
  @Size(min = 10, message = "Message must be at least 10 characters")
  private String message;

  // Getters y setters
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  // Método toString
  @Override
  public String toString() {
    return "ContactRequest{name='" + name + "', email='" + email + "', message='" + message + "'}";
  }
}
