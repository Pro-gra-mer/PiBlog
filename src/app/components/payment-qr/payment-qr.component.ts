import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.dev';
declare let Pi: any;

@Component({
  selector: 'app-payment-qr',
  standalone: true,
  imports: [],
  templateUrl: './payment-qr.component.html',
  styleUrl: './payment-qr.component.css',
})
export class PaymentQrComponent implements OnInit {
  paymentId: string = '';
  planType: string = '';
  status: string = 'Initializing payment...';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.paymentId = this.route.snapshot.queryParamMap.get('paymentId') || '';
    this.planType = this.route.snapshot.queryParamMap.get('plan') || '';

    if (!this.paymentId || !this.planType) {
      this.status = '❌ Missing payment data in URL';
      return;
    }

    Pi.createPayment(
      {
        paymentId: this.paymentId,
        amount: 0,
        memo: 'Payment for plan ' + this.planType,
        metadata: { planType: this.planType },
      },
      {
        onReadyForServerApproval: (paymentId: string) => {
          const token =
            localStorage.getItem('user') &&
            JSON.parse(localStorage.getItem('user')!).accessToken;
          const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          };
          this.http
            .post(
              `${environment.apiUrl}/api/payments/approve`,
              { paymentId, planType: this.planType },
              { headers }
            )
            .subscribe(() => {
              this.status = '✅ Payment approved, waiting for completion...';
            });
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          const token =
            localStorage.getItem('user') &&
            JSON.parse(localStorage.getItem('user')!).accessToken;
          const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          };
          this.http
            .post(
              `${environment.apiUrl}/api/payments/complete`,
              { paymentId, txid },
              { headers }
            )
            .subscribe((res: any) => {
              this.status = '✅ Payment completed!';
              const articleId = res.articleId;
              this.http
                .post(
                  `${environment.apiUrl}/api/ws/notify-payment`,
                  { paymentId, articleId },
                  { headers }
                )
                .subscribe();
              setTimeout(
                () =>
                  this.router.navigate([
                    '/user-dashboard/edit-article',
                    articleId,
                  ]),
                1500
              );
            });
        },
        onCancel: () => {
          this.status = '⚠️ Payment was cancelled.';
        },
        onError: (error: any) => {
          console.error('Payment error', error);
          this.status = '❌ Payment failed.';
        },
      }
    );
  }
}
