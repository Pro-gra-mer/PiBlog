import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.css',
})
export class CookieBannerComponent {
  showBanner = false;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookie_consent');
      this.showBanner = consent !== 'accepted';
    }
  }

  acceptCookies(): void {
    localStorage.setItem('cookie_consent', 'accepted');
    this.showBanner = false;
  }
}
