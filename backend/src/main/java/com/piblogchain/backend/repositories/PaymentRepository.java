package com.piblogchain.backend.repositories;

import com.piblogchain.backend.models.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, String> {
  Payment findTopByUsernameAndStatusOrderByCompletedAtDesc(String username, String status);

}
