package com.piblogchain.backend.utils;

import org.springframework.security.core.Authentication;

public class SecurityUtils {

  public static boolean isOwnerOrAdmin(Authentication auth, String createdBy) {
    boolean isAdmin = auth.getAuthorities().stream()
      .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    return isAdmin || auth.getName().equals(createdBy);
  }

}
