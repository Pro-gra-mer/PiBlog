package com.piblogchain.backend.services;

import com.piblogchain.backend.dto.ContactRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;


@Service
public class EmailService {
  @Autowired
  private JavaMailSender mailSender;

  @Value("${MAIL_USERNAME}")
  private String from;

  public void sendEmail(ContactRequest request) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(from); // o un correo destino fijo
    message.setSubject("New Contact from " + request.getName());
    message.setText("Email: " + request.getEmail() + "\n\nMessage:\n" + request.getMessage());
    mailSender.send(message);
  }
}
