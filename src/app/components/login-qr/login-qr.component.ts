import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionLinkService } from '../../services/session-link.service';
import { PiAuthService } from '../../services/pi-auth.service';
@Component({
  selector: 'app-login-qr',
  standalone: true,
  imports: [],
  templateUrl: './login-qr.component.html',
  styleUrl: './login-qr.component.css',
})
export class LoginQrComponent implements OnInit {
  code: string = '';
  status: string = 'Waiting for authentication...';

  constructor(
    private route: ActivatedRoute,
    private sessionService: SessionLinkService,
    private piAuthService: PiAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      this.piAuthService.loginWithPi((accessToken: string) => {
        this.sessionService.syncSession(code, accessToken).subscribe(() => {
          this.router.navigate(['/']);
        });
      });
    } else {
      this.router.navigate(['/']);
    }
  }

  startLoginFlow(): void {
    this.status = '🔐 Authenticating with Pi Network...';
    this.piAuthService.loginWithPi((accessToken: string) => {
      this.status = '🔁 Syncing session with desktop...';
      this.sessionService.syncSession(this.code, accessToken).subscribe({
        next: () => {
          this.status = '✅ Session synced! You can now use the desktop.';
        },
        error: () => {
          this.status = '❌ Failed to sync session with backend.';
        },
      });
    });
  }
}
