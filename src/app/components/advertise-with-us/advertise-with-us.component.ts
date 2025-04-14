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

  pay(plan: PlanType): void {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      console.error('Usuario no autenticado');
      return;
    }

    const user = JSON.parse(storedUser);
    const payload = {
      planType: plan,
      username: user.username,
    };

    this.http
      .post(`${environment.apiUrl}/api/payments/create`, payload)
      .subscribe({
        next: (payment: any) => {
          // 🧪 SANDBOX
          if (environment.sandbox || user.username === 'sandbox-user') {
            alert('🧪 Modo sandbox activo. Simulando pago completo sin SDK.');

            const fakePaymentId = 'sandbox-' + Date.now();
            const fakeTxId = 'sandbox-tx-' + Date.now();

            localStorage.setItem('pendingPaymentId', fakePaymentId); // Guardar para usar luego

            this.http
              .post(`${environment.apiUrl}/api/payments/approve`, {
                paymentId: fakePaymentId,
                planType: plan,
              })
              .subscribe(() => {
                this.http
                  .post(`${environment.apiUrl}/api/payments/complete`, {
                    paymentId: fakePaymentId,
                    txid: fakeTxId,
                  })
                  .subscribe(() => {
                    this.showSuccess = true;
                    setTimeout(() => {
                      this.showSuccess = false;
                      this.router.navigate(['/user-dashboard/create-article']);
                    }, 3000);
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
              localStorage.setItem('pendingPaymentId', paymentId); // ✅ Guardar para usarlo en create-article

              this.http
                .post(`${environment.apiUrl}/api/payments/approve`, {
                  paymentId,
                  planType: plan,
                })
                .subscribe();
            },
            onReadyForServerCompletion: (paymentId: string, txid: string) => {
              this.http
                .post(`${environment.apiUrl}/api/payments/complete`, {
                  paymentId,
                  txid,
                })
                .subscribe(() => {
                  alert(`✅ ¡Pago completado con éxito para el plan ${plan}!`);
                  this.router.navigate(['/user-dashboard/create-article']);
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
