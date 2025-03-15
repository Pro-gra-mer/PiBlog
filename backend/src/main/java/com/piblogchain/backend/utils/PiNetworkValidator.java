package com.piblogchain.backend.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import java.security.PublicKey;
import java.security.KeyFactory;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;

@Component
public class PiNetworkValidator {

  private static final String PI_PUBLIC_KEY_URL = "https://api.minepi.com/v2/.well-known/jwks.json";
  private static final String PI_SANDBOX_PUBLIC_KEY_URL = "https://api.testnet.minepi.com/v2/.well-known/jwks.json";

  @Value("${spring.profiles.active:dev}")
  private String activeProfile;

  public boolean validateAccessToken(String accessToken) {
    System.out.println("🔍 Validando accessToken: " + accessToken);
    System.out.println("🌐 Perfil activo: " + activeProfile);

    // Modo desarrollo o sandbox: aceptar token sin validación JWT
    if ("dev".equals(activeProfile) || "sandbox".equals(activeProfile)) {
      System.out.println("🟢 Modo sandbox/dev: token aceptado sin validación JWT");
      return true; // En sandbox, el token no es un JWT firmado
    }

    // Modo producción: validar como JWT
    try {
      PublicKey piPublicKey = getPiPublicKey();
      Jws<Claims> claims = Jwts.parserBuilder()
        .setSigningKey(piPublicKey)
        .build()
        .parseClaimsJws(accessToken);
      System.out.println("✅ Token JWT válido: " + claims.getBody());
      return true;
    } catch (Exception e) {
      System.out.println("❌ Error validando token como JWT: " + e.getMessage());
      return false;
    }
  }

  private PublicKey getPiPublicKey() throws Exception {
    String url = "prod".equals(activeProfile) ? PI_PUBLIC_KEY_URL : PI_SANDBOX_PUBLIC_KEY_URL;
    RestTemplate restTemplate = new RestTemplate();
    ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

    if (response.getBody() == null || !response.getBody().containsKey("keys")) {
      throw new IllegalStateException("No se pudo obtener la clave pública de Pi Network");
    }

    // Asumimos que la primera clave en "keys" es la correcta
    @SuppressWarnings("unchecked")
    Map<String, Object> key = (Map<String, Object>) ((java.util.List<?>) response.getBody().get("keys")).get(0);
    String publicKeyPem = (String) key.get("x5c"); // x5c es un array, tomar el primer elemento
    byte[] decodedKey = Base64.getDecoder().decode(publicKeyPem);

    X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decodedKey);
    KeyFactory keyFactory = KeyFactory.getInstance("RSA");

    return keyFactory.generatePublic(keySpec);
  }
}
