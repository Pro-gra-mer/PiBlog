package com.piblogchain.backend.security;

import com.piblogchain.backend.utils.PiNetworkValidator;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.PublicKey;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final PiNetworkValidator piNetworkValidator;

  @Autowired
  public JwtAuthenticationFilter(PiNetworkValidator piNetworkValidator) {
    this.piNetworkValidator = piNetworkValidator;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
    throws ServletException, IOException {

    String authorizationHeader = request.getHeader("Authorization");
    System.out.println("📥 Authorization header: " + authorizationHeader);

    if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
      chain.doFilter(request, response);
      return;
    }

    String token = authorizationHeader.substring(7);
    System.out.println("🔑 Token extraído: " + token);

    if (!piNetworkValidator.validateAccessToken(token)) {
      System.out.println("❌ Token no válido");
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid access token");
      return;
    }
    System.out.println("✅ Token válido");

    String piId;
    String role;
    if ("dev".equals(piNetworkValidator.getActiveProfile()) || "sandbox".equals(piNetworkValidator.getActiveProfile())) {
      // En modo sandbox/dev, usar valores por defecto
      piId = "sandbox-user";
      role = "USER"; // O ajusta según el usuario autenticado
    } else {
      // En modo producción, validar como JWT
      try {
        PublicKey publicKey = piNetworkValidator.getPiPublicKey();
        Claims claims = Jwts.parserBuilder()
          .setSigningKey(publicKey)
          .build()
          .parseClaimsJws(token)
          .getBody();
        piId = claims.getSubject();
        role = claims.get("role", String.class);
        System.out.println("👤 piId: " + piId + ", role: " + role);
      } catch (Exception e) {
        System.out.println("⚠️ Error procesando claims: " + e.getMessage());
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token claims");
        return;
      }
    }

    if (piId != null && role != null) {
      UsernamePasswordAuthenticationToken authToken =
        new UsernamePasswordAuthenticationToken(piId, null, Collections.singleton(() -> "ROLE_" + role));
      SecurityContextHolder.getContext().setAuthentication(authToken);
      System.out.println("🔒 Contexto de seguridad establecido: " + authToken);
    }

    chain.doFilter(request, response);
  }
}
