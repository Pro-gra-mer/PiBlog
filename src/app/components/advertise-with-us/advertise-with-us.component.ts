import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment.dev';
import { PlanType } from '../../models/PlanType.model';
import { Router } from '@angular/router';

declare let Pi: any;

@Component({
  selector: 'app-advertise-with-us',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './advertise-with-us.component.html',
  styleUrl: './advertise-with-us.component.css',
})
export class AdvertiseWithUsComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly PlanType = PlanType;
  showSuccess = false;
  showLoginMessage = false;

  pay(plan: PlanType): void {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      console.warn('User not authenticated');
      this.showLoginMessage = true;
      setTimeout(() => {
        this.showLoginMessage = false;
      }, 4000);
      return;
    }

    const user = JSON.parse(storedUser);
    const timestamp = Date.now();
    const fakePaymentId = 'sandbox-' + timestamp;
    const fakeTxId = 'sandbox-tx-' + timestamp;

    const payload = {
      planType: plan,
      username: user.username,
      paymentId: fakePaymentId,
    };

    this.http
      .post(`${environment.apiUrl}/api/payments/create`, payload)
      .subscribe({
        next: (payment: any) => {
          if (environment.sandbox || user.username === 'sandbox-user') {
            alert('🧪 Modo sandbox activo. Simulando pago completo sin SDK.');
            localStorage.setItem('pendingPaymentId', fakePaymentId);

            const accessToken = user.accessToken;
            const headers = {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            };

            this.http
              .post(
                `${environment.apiUrl}/api/payments/approve`,
                {
                  paymentId: fakePaymentId,
                  planType: plan,
                },
                { headers }
              )
              .subscribe(() => {
                this.http
                  .post(
                    `${environment.apiUrl}/api/payments/complete`,
                    {
                      paymentId: fakePaymentId,
                      txid: fakeTxId,
                    },
                    { headers }
                  )
                  .subscribe((response: any) => {
                    const articleId = response.articleId;
                    this.showSuccess = true;
                    setTimeout(() => {
                      this.router.navigate([
                        `/user-dashboard/edit-article/${articleId}`,
                      ]);
                    }, 2500);
                  });
              });

            return;
          }

          // 🟢 PRODUCCIÓN
          if (typeof Pi === 'undefined') {
            console.error('Pi SDK no disponible');
            return;
          }

          Pi.createPayment(payment, {
            onReadyForServerApproval: (paymentId: string) => {
              localStorage.setItem('pendingPaymentId', paymentId);
              const storedUser = localStorage.getItem('user');
              if (!storedUser) return;

              const user = JSON.parse(storedUser);
              const accessToken = user.accessToken;

              const headers = {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              };

              this.http
                .post(
                  `${environment.apiUrl}/api/payments/approve`,
                  {
                    paymentId,
                    planType: plan,
                  },
                  { headers }
                )
                .subscribe({
                  next: () => console.log('✔ Pago aprobado.'),
                  error: (err) =>
                    console.error('❌ Error al aprobar el pago:', err),
                });
            },

            onReadyForServerCompletion: (paymentId: string, txid: string) => {
              const storedUser = localStorage.getItem('user');
              if (!storedUser) return;

              const user = JSON.parse(storedUser);
              const accessToken = user.accessToken;

              const headers = {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              };

              this.http
                .post(
                  `${environment.apiUrl}/api/payments/complete`,
                  {
                    paymentId,
                    txid,
                  },
                  { headers }
                )
                .subscribe({
                  next: () => {
                    alert(
                      `✅ ¡Pago completado con éxito para el plan ${plan}!`
                    );
                    this.router.navigate(['/user-dashboard/create-article']);
                  },
                  error: (err) => {
                    console.error('❌ Error al completar el pago:', err);
                  },
                });
            },

            onCancel: (paymentId: string) => {
              console.warn('❌ Pago cancelado', paymentId);
              alert('⚠️ El pago fue cancelado o no se confirmó a tiempo.');
              localStorage.removeItem('pendingPaymentId');
            },

            onError: (error: any, paymentId: string) => {
              console.error('⚠️ Error en el pago', error, paymentId);
              alert('❌ Ha ocurrido un error al procesar el pago.');
              localStorage.removeItem('pendingPaymentId');
            },
          });
        },
        error: (err) => {
          console.error('Error al crear el pago:', err);
        },
      });
  }
}
