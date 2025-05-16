package com.piblogchain.backend.controllers;

import com.piblogchain.backend.services.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/price")
public class PiPriceController {

  @Autowired
  private PaymentService paymentService;

  @GetMapping
  public Map<String, Object> getPlanPricesInUsd() {
    return paymentService.getPlanPricesInUsd();
  }
}
