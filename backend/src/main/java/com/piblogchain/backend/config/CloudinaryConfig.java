package com.piblogchain.backend.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

  @Value("${cloudinary.url}")
  private String cloudinaryUrl;

  @Bean
  public Cloudinary cloudinary() {
    Cloudinary cloudinary = new Cloudinary(cloudinaryUrl);
    System.out.println("Cloudinary configurado con: " + cloudinary.config.cloudName);
    return cloudinary;
  }
}
