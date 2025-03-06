package com.piblogchain.backend.utils;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Base64;
import java.util.Date;

public class JwtUtil {

  private static final String SECRET_KEY_ENV = System.getenv("JWT_SECRET_KEY");

  static {
    if (SECRET_KEY_ENV == null || SECRET_KEY_ENV.isEmpty()) {
      throw new IllegalStateException("JWT_SECRET_KEY no está configurada en las variables de entorno.");
    }
  }

  private static final Key SECRET_KEY = Keys.hmacShaKeyFor(Base64.getDecoder().decode(SECRET_KEY_ENV));

  private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 24; // 24 horas

  public static String generateToken(String piId, String role) {
    return Jwts.builder()
      .setSubject(piId)
      .claim("role", role)
      .setIssuedAt(new Date())
      .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
      .signWith(SECRET_KEY)
      .compact();
  }
}
