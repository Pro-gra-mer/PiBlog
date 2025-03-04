import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
declare const Pi: any; // Asegura que Pi SDK esté disponible en el frontend

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  isMenuOpen = false;
  user: any = null;

  constructor() {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  loginWithPi() {
    Pi.authenticate()
      .then((auth: any) => {
        this.user = auth.user;
        console.log('User authenticated:', this.user);
      })
      .catch((err: any) => {
        console.error('Authentication failed:', err);
      });
  }
}
