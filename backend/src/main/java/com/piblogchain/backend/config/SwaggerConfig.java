package com.piblogchain.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

  @Bean
  public OpenAPI customOpenAPI() {
    return new OpenAPI()
      .info(new Info()
        .title("PiBlogChain API")
        .version("1.0")
        .description("API para la gestión de autenticación, artículos y suscripciones en PiBlogChain"))
      .addSecurityItem(new SecurityRequirement().addList("BearerAuth"))
      .schemaRequirement("BearerAuth", new SecurityScheme()
        .name("Authorization")
        .type(SecurityScheme.Type.HTTP)
        .scheme("bearer")
        .bearerFormat("JWT"));
  }
}
