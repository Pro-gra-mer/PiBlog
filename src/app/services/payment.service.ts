import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  startPayment(plan: string) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Paso 1: Crear el pago en el backend
    this.http
      .post<any>('/api/payments/create', {
        username: user.username,
        planType: plan,
      })
      .subscribe({
        next: (createResponse) => {
          const amount = createResponse.amount;
          const memo = createResponse.memo;
          const paymentId = createResponse.paymentId;

          console.log('🧾 Backend creó el pago con ID:', paymentId);

          // Paso 2: Iniciar pago con el Pi SDK
          if (typeof Pi === 'undefined') {
            console.error('❌ Pi SDK no disponible.');
            return;
          }

          Pi.createPayment({
            amount: amount.toString(),
            memo,
            metadata: {
              planType: plan,
              username: user.username,
            },
            paymentId, // 👈 este ID ya está registrado en la base de datos

            onReadyForServerApproval: (idFromPi: string) => {
              console.log('🔐 ID del SDK:', idFromPi);
              console.log('🧾 ID del backend:', paymentId); // Este lo defines arriba

              if (idFromPi !== paymentId) {
                console.warn('⚠️ ID del SDK no coincide con el del backend');
                return;
              }
              this.http
                .post('/api/payments/approve', {
                  paymentId: idFromPi,
                  username: user.username,
                  piId: user.piId,
                  plan,
                })

                .subscribe({
                  next: () => console.log('✔ Pago aprobado.'),
                  error: (err) =>
                    console.error('❌ Error al aprobar pago:', err),
                });
            },

            onReadyForServerCompletion: (idFromPi: string, txid: string) => {
              console.log('💰 Completando pago:', idFromPi, txid);
              this.http
                .post('/api/payments/complete', {
                  paymentId: idFromPi,
                  txid,
                })
                .subscribe({
                  next: () => console.log('✅ Pago completado.'),
                  error: (err) =>
                    console.error('❌ Error al completar pago:', err),
                });
            },

            onCancel: (paymentId: string) => {
              console.warn('⚠️ Pago cancelado:', paymentId);
            },

            onError: (error: any) => {
              console.error('❌ Error en pago:', error);
            },
          });
        },
        error: (error) => {
          console.error('❌ Error al crear pago en el backend:', error);
        },
      });
  }
}
