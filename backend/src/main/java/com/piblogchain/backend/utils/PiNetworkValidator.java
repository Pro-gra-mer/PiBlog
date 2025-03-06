package com.piblogchain.backend.utils;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;

@Component
public class PiNetworkValidator {

  private static final String PI_API_URL = "https://api.minepi.com/v2/me";

  public boolean validateAccessToken(String accessToken, String piId) {
    try {
      RestTemplate restTemplate = new RestTemplate();
      HttpHeaders headers = new HttpHeaders();
      headers.set("Authorization", "Bearer " + accessToken);

      HttpEntity<String> entity = new HttpEntity<>(headers);
      ResponseEntity<String> response = restTemplate.postForEntity(PI_API_URL, entity, String.class);

      // Si la respuesta contiene el piId, el token es válido
      return response.getBody() != null && response.getBody().contains(piId);
    } catch (Exception e) {
      return false; // Token inválido
    }
  }
}
