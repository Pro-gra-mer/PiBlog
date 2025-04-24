import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { PiAuthService } from './pi-auth.service';
import { environment } from '../environments/environment.dev';
import { Subject } from 'rxjs';

declare let Pi: any;

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  // Observable para notificar cuando se completa una renovación
  renewalCompleted$ = new Subject<{
    articleId: number;
    expirationAt: string;
    planType: string;
  }>();

  constructor(private http: HttpClient, private piAuthService: PiAuthService) {}

  renewSubscription(articleId: number, planType: string): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.accessToken || !user.username) {
      console.error('No se encontró un token o usuario válido');
      alert('You must be logged in with Pi to make payments.');
      this.piAuthService.forceReauthentication();
      return;
    }

    // Generar IDs para modo sandbox
    const timestamp = Date.now();
    const fakePaymentId = 'sandbox-' + timestamp;
    const fakeTxId = 'sandbox-tx-' + timestamp;

    // Configurar headers con el token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    });

    // Detectar modo sandbox
    if (environment.sandbox || user.username === 'sandbox-user') {
      console.log(
        '🧪 Modo sandbox activo. Simulando pago para articleId:',
        articleId
      );

      const payload = {
        articleId,
        planType,
        username: user.username,
        paymentId: fakePaymentId,
      };

      this.http
        .post(`${environment.apiUrl}/api/payments/create`, payload, { headers })
        .subscribe({
          next: () => {
            console.log('✔ Pago creado en modo sandbox:', fakePaymentId);
            // Aprobar el pago
            this.http
              .post(
                `${environment.apiUrl}/api/payments/approve`,
                {
                  paymentId: fakePaymentId,
                  planType,
                },
                { headers }
              )
              .subscribe({
                next: () => {
                  console.log('✔ Pago aprobado en modo sandbox');
                  // Completar el pago
                  this.http
                    .post(
                      `${environment.apiUrl}/api/payments/complete`,
                      {
                        paymentId: fakePaymentId,
                        txid: fakeTxId,
                        articleId,
                      },
                      { headers }
                    )
                    .subscribe({
                      next: () => {
                        console.log('✔ Pago completado en modo sandbox');
                        alert(
                          '✅ Pago simulado completado con éxito para el plan ' +
                            planType
                        );

                        // ✅ Obtener la fecha real desde el backend
                        this.http
                          .get(
                            `${environment.apiUrl}/api/payments/by-article/${articleId}`,
                            { headers }
                          )
                          .subscribe({
                            next: (payment: any) => {
                              const realExpiration = payment.expirationAt;
                              this.renewalCompleted$.next({
                                articleId,
                                expirationAt: realExpiration,
                                planType,
                              });
                            },
                            error: (err) => {
                              console.error(
                                '❌ Error al obtener la fecha de expiración real:',
                                err
                              );
                            },
                          });
                      },
                      error: (err) => {
                        console.error(
                          '❌ Error al completar el pago simulado:',
                          err
                        );
                        alert('❌ Error al simular el pago.');
                      },
                    });
                },
                error: (err) => {
                  console.error('❌ Error al aprobar el pago simulado:', err);
                  alert('❌ Error al simular el pago.');
                },
              });
          },
          error: (err) => {
            console.error('❌ Error al crear el pago simulado:', err);
            alert('❌ Error al simular el pago.');
          },
        });
      return;
    }

    // Modo producción
    // Verificar los scopes del token
    const decodedToken = this.decodeJwt(user.accessToken);
    const scopes = decodedToken?.scope?.split(' ') || [];
    console.log('Scopes del token:', scopes);
    if (!scopes.includes('payments')) {
      console.error('El token no incluye el scope "payments":', scopes);
      alert(
        'Error: No tienes permisos de pago. Por favor, vuelve a iniciar sesión.'
      );
      this.piAuthService.forceReauthentication();
      return;
    }

    console.log('🧾 Renewing for articleId:', articleId, 'planType:', planType);

    this.http
      .post(
        `${environment.apiUrl}/api/payments/create`,
        {
          articleId,
          planType,
          username: user.username,
        },
        { headers }
      )
      .pipe(
        map((response: any) => ({
          amount: response.amount,
          memo: response.memo,
          paymentId: response.paymentId,
        }))
      )
      .subscribe({
        next: ({ amount, memo, paymentId }) => {
          if (typeof Pi === 'undefined') {
            console.error('❌ Pi SDK no disponible.');
            alert('Error: Pi SDK no está disponible.');
            return;
          }

          Pi.createPayment(
            {
              amount,
              memo,
              metadata: { paymentId },
            },
            {
              onReadyForServerApproval: (piPaymentId: string) => {
                console.log('onReadyForServerApproval', piPaymentId);
                this.http
                  .post(
                    `${environment.apiUrl}/api/payments/approve`,
                    {
                      piPaymentId,
                      paymentId,
                    },
                    { headers }
                  )
                  .subscribe({
                    next: () => console.log('✔ Pago aprobado.'),
                    error: (err) =>
                      console.error('❌ Error al aprobar el pago:', err),
                  });
              },
              onReadyForServerCompletion: (
                piPaymentId: string,
                txid: string
              ) => {
                console.log('onReadyForServerCompletion', piPaymentId, txid);
                this.http
                  .post(
                    `${environment.apiUrl}/api/payments/complete`,
                    {
                      piPaymentId,
                      paymentId,
                      txid,
                    },
                    { headers }
                  )
                  .subscribe({
                    next: () => {
                      console.log('✔ Pago completado en modo sandbox');
                      alert(
                        '✅ Pago simulado completado con éxito para el plan ' +
                          planType
                      );

                      // ✅ Obtener la fecha real desde el backend
                      this.http
                        .get(
                          `${environment.apiUrl}/api/payments/by-article/${articleId}`,
                          { headers }
                        )
                        .subscribe({
                          next: (payment: any) => {
                            const realExpiration = payment.expirationAt;
                            this.renewalCompleted$.next({
                              articleId,
                              expirationAt: realExpiration,
                              planType,
                            });
                          },
                          error: (err) => {
                            console.error(
                              '❌ Error al obtener la fecha de expiración real:',
                              err
                            );
                          },
                        });
                    },
                    error: (err) => {
                      console.error('❌ Error al completar el pago:', err);
                      alert('❌ Error al procesar el pago.');
                    },
                  });
              },
              onCancel: (piPaymentId: string) => {
                console.log('onCancel', piPaymentId);
                alert('⚠️ El pago fue cancelado.');
              },
              onError: (error: any, payment: any) => {
                console.error('onError', error, payment);
                alert('❌ Error al procesar el pago.');
              },
            }
          );
        },
        error: (err) => {
          console.error('❌ Error al crear el pago:', err);
          alert('❌ Error al iniciar el pago.');
        },
      });
  }

  private decodeJwt(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error('Error al decodificar el token:', e);
      return null;
    }
  }
  promoteArticle(articleId: number, planType: string): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.accessToken || !user.username) {
      alert('You must be logged in with Pi to make payments.');
      this.piAuthService.forceReauthentication();
      return;
    }

    const timestamp = Date.now();
    const fakePaymentId = 'sandbox-' + timestamp;
    const fakeTxId = 'sandbox-tx-' + timestamp;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    });

    const payload = {
      articleId,
      planType,
      username: user.username,
      paymentId: fakePaymentId,
    };

    if (environment.sandbox || user.username === 'sandbox-user') {
      console.log('🧪 Simulando promoción para:', articleId);

      this.http
        .post(`${environment.apiUrl}/api/payments/create`, payload, { headers })
        .subscribe({
          next: () => {
            this.http
              .post(
                `${environment.apiUrl}/api/payments/approve`,
                { paymentId: fakePaymentId, planType },
                { headers }
              )
              .subscribe({
                next: () => {
                  this.http
                    .post(
                      `${environment.apiUrl}/api/payments/complete`,
                      { paymentId: fakePaymentId, txid: fakeTxId, articleId },
                      { headers }
                    )
                    .subscribe({
                      next: () => {
                        alert(`✅ Video promocionado con plan ${planType}`);
                        this.http
                          .get(
                            `${environment.apiUrl}/api/payments/by-article/${articleId}`,
                            { headers }
                          )
                          .subscribe({
                            next: (payment: any) => {
                              const realExpiration = payment.expirationAt;
                              this.renewalCompleted$.next({
                                articleId,
                                expirationAt: realExpiration,
                                planType,
                              });
                            },
                          });
                      },
                    });
                },
              });
          },
        });
      return;
    }

    // Producción con Pi SDK
    this.http
      .post(
        `${environment.apiUrl}/api/payments/create`,
        {
          articleId,
          planType,
          username: user.username,
        },
        { headers }
      )
      .pipe(
        map((res: any) => ({
          amount: res.amount,
          memo: res.memo,
          paymentId: res.paymentId,
        }))
      )
      .subscribe({
        next: ({ amount, memo, paymentId }) => {
          Pi.createPayment(
            {
              amount,
              memo,
              metadata: { paymentId },
            },
            {
              onReadyForServerApproval: (piPaymentId: string) => {
                this.http
                  .post(
                    `${environment.apiUrl}/api/payments/approve`,
                    { piPaymentId, paymentId },
                    { headers }
                  )
                  .subscribe();
              },
              onReadyForServerCompletion: (
                piPaymentId: string,
                txid: string
              ) => {
                this.http
                  .post(
                    `${environment.apiUrl}/api/payments/complete`,
                    {
                      piPaymentId,
                      paymentId,
                      txid,
                      articleId,
                    },
                    { headers }
                  )
                  .subscribe({
                    next: () => {
                      alert(`✅ Promoción completada con plan ${planType}`);
                      this.http
                        .get(
                          `${environment.apiUrl}/api/payments/by-article/${articleId}`,
                          { headers }
                        )
                        .subscribe({
                          next: (payment: any) => {
                            this.renewalCompleted$.next({
                              articleId,
                              expirationAt: payment.expirationAt,
                              planType,
                            });
                          },
                        });
                    },
                  });
              },
              onCancel: () => alert('⚠️ Pago cancelado'),
              onError: () => alert('❌ Error en el pago'),
            }
          );
        },
        error: (err) => {
          console.error('❌ Error al iniciar la promoción:', err);
          alert('❌ Error al iniciar la promoción');
        },
      });
  }
}
