import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// services/payment.service.ts
@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  startPayment(plan: string, amount: number, memo: string) {
    if (typeof Pi === 'undefined') {
      console.error('Pi SDK not available.');
      return;
    }

    Pi.createPayment({
      amount: amount.toString(),
      memo,
      metadata: { plan },
      onReadyForServerApproval: async (paymentId: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        await this.http
          .post('/api/payments/approve', {
            paymentId,
            username: user.username,
            piId: user.piId,
            plan,
          })
          .toPromise();
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        await this.http
          .post('/api/payments/complete', {
            paymentId,
            txid,
          })
          .toPromise();
        // Aquí podrías redirigir o mostrar éxito
      },
      onCancel: (paymentId: string) => {
        console.warn('Pago cancelado:', paymentId);
      },
      onError: (error: any) => {
        console.error('Error en pago:', error);
      },
    });
  }
}
