package com.piblogchain.backend.config;

import com.piblogchain.backend.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@EnableMethodSecurity(prePostEnabled = true)
@Configuration
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  @Autowired
  public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      .cors(cors -> cors.configurationSource(corsConfigurationSource()))
      .csrf(csrf -> csrf.disable())
      .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        // Acceso público: Swagger, autenticación y rutas generales
        .requestMatchers("/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

        // Público: artículos y categorías
        .requestMatchers(HttpMethod.GET, "/api/articles").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/articles/{id:[\\d]+}").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/articles/category/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/categories").permitAll()

        // Admin: CRUD de categorías
        .requestMatchers("/api/categories/**").hasRole("ADMIN")

        // Usuarios autenticados: acceso a estado de sus artículos
        .requestMatchers(HttpMethod.GET, "/api/articles/status/**").hasAnyRole("USER", "ADMIN")

        // Usuarios autenticados: creación/edición de artículos y subida de imágenes
        .requestMatchers("/api/articles/**", "/api/upload-image").hasAnyRole("USER", "ADMIN")

        // Usuarios autenticados: eliminación de imágenes y videos
        .requestMatchers(HttpMethod.DELETE, "/api/cleanup/**").hasAnyRole("USER", "ADMIN")

        .requestMatchers(HttpMethod.PUT, "/api/articles/{id:[\\d]+}/reject").hasRole("ADMIN")

        .requestMatchers(HttpMethod.GET, "/api/articles/rejected").hasAnyRole("USER", "ADMIN")


        // Resto de peticiones requieren autenticación
        .anyRequest().authenticated()
      )
      .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
      .formLogin(form -> form.disable())
      .httpBasic(httpBasic -> httpBasic.disable());

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(
      "http://localhost:4200",
      "https://sandbox.minepi.com/mobile-app-ui/app/rolling-pi",
      "https://rollingpi.com"
    ));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
