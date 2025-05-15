import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // ✅
import { Client, IMessage } from '@stomp/stompjs';
import { SessionLinkService } from '../../services/session-link.service';
import { Router } from '@angular/router';
import QRCode from 'qrcode';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment.dev';

@Component({
  selector: 'app-session-qr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-qr.component.html',
  styleUrl: './session-qr.component.css',
})
export class SessionQrComponent implements OnInit {
  sessionCode = '';
  qrDataUrl = '';
  private stompClient: Client | null = null;

  constructor(
    private sessionService: SessionLinkService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const isPiBrowser = navigator.userAgent.includes('PiBrowser');
    if (isPiBrowser) {
      this.router.navigate(['/']);
      return;
    }

    this.sessionService.createSessionCode().subscribe(async (code: string) => {
      this.sessionCode = code;
      const url = `https://pi.app/rollingpi?code=${code}`;
      this.qrDataUrl = await QRCode.toDataURL(url);
    });
  }

  private connectToWebSocket(code: string): void {
    this.stompClient = new Client({
      brokerURL: environment.wsUrl,
      reconnectDelay: 5000,
      debug: (msg) => console.log('[STOMP]', msg),
      onWebSocketError: (error) => {
        console.error('WebSocket connection error:', error);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onConnect: () => {
        console.log('WebSocket connected successfully');
        this.stompClient?.subscribe(
          `/topic/session/${this.sessionCode}`,
          (message: IMessage) => {
            const username = JSON.parse(message.body);
            console.log('✅ Usuario sincronizado:', username);
            this.router.navigate(['/dashboard']);
          }
        );
      },
    });
    this.stompClient.activate();
  }
}
