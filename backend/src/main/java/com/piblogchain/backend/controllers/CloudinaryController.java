package com.piblogchain.backend.controllers;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class CloudinaryController {

  private final Cloudinary cloudinary;

  public CloudinaryController(@Value("${cloudinary.url}") String cloudinaryUrl) {
    this.cloudinary = new Cloudinary(cloudinaryUrl);
    System.out.println("Cloudinary configurado con: " + cloudinary.config.cloudName);
  }

  @GetMapping("/api/cloudinary-signature")
  public Map<String, String> getUploadSignature() {
    String timestamp = String.valueOf(System.currentTimeMillis() / 1000);

    // Incluir todos los parámetros que el widget usará
    Map<String, Object> paramsToSign = new HashMap<>();
    paramsToSign.put("timestamp", timestamp);
    paramsToSign.put("upload_preset", "mipreset");
    paramsToSign.put("source", "uw"); // Añadir 'source' si el widget lo incluye

    String signature = cloudinary.apiSignRequest(paramsToSign, cloudinary.config.apiSecret);

    Map<String, String> response = new HashMap<>();
    response.put("signature", signature);
    response.put("timestamp", timestamp);
    response.put("apiKey", cloudinary.config.apiKey);
    response.put("cloudName", cloudinary.config.cloudName);
    response.put("uploadPreset", "mipreset");
    response.put("source", "uw"); // Incluir en la respuesta si es necesario

    return response;
  }
}
