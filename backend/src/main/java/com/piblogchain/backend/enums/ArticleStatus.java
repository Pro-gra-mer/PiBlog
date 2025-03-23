package com.piblogchain.backend.enums;

public enum ArticleStatus {
  DRAFT,             // Borrador que puede modificar el usuario
  PENDING_APPROVAL,  // Enviado para revisión por el admin
  PUBLISHED          // Aprobado y publicado
}
