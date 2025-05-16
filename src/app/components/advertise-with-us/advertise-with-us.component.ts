import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment.dev';
import { Router } from '@angular/router';
import { PromoteType } from '../../models/PromoteType';
import { CategoryService } from '../../services/category.service';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import { Category } from '../../models/Category.model';

declare let Pi: any;

@Component({
  selector: 'app-advertise-with-us',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './advertise-with-us.component.html',
  styleUrl: './advertise-with-us.component.css',
})
export class AdvertiseWithUsComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  readonly PromoteType = PromoteType;

  showSuccess = false;
  showLoginMessage = false;
  selectedPlan: PromoteType | null = null;
  showConfirmModal = false;
  mainSliderAvailable = true;
  categorySliderAvailable = true;
  availableSlots: { [key: string]: number } = {};
  categories: Category[] = [];
  selectedCategory: string = '';
  private categoryService = inject(CategoryService);
  piPriceUsd: number = 1;
  standardPricePi!: number;
  categoryPricePi!: number;
  mainPricePi!: number;
  acceptedTerms: boolean = false;
  showTermsError: boolean = false;
  qrDataUrl: string = '';
  qrUrl: string = '';
  showQr: boolean = false;
  private qrCheckInterval: any = null;
  isChecking: boolean = false;

  ngOnInit(): void {
    this.fetchPlanPricesInPi();
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
        if (data.length > 0) {
          this.selectedCategory = data[0].slug || '';
          this.checkCategorySliderSlot();
        }
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to fetch categories');
        }
      },
    });

    this.checkMainSliderSlot();
  }

  checkMainSliderSlot(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    const headers = { Authorization: `Bearer ${user.accessToken}` };
    const url = `${environment.apiUrl}/api/payments/slots?promoteType=${PromoteType.MAIN_SLIDER}`;

    this.http
      .get<{
        available: boolean;
        usedSlots: number;
        remainingSlots: number;
        totalSlots: number;
      }>(url, { headers })
      .subscribe({
        next: (res) => {
          this.mainSliderAvailable = res.remainingSlots > 0;
          this.availableSlots['MAIN_SLIDER'] = res.remainingSlots;
          if (!environment.production) {
            console.log(`MAIN_SLIDER remaining: ${res.remainingSlots}`);
          }
        },
        error: () => {
          if (!environment.production) {
            console.error('Failed to check MAIN_SLIDER slots');
          }
        },
      });
  }

  checkCategorySliderSlot(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const storedUser = localStorage.getItem('user');
    if (!storedUser || !this.selectedCategory) return;

    const user = JSON.parse(storedUser);
    const headers = { Authorization: `Bearer ${user.accessToken}` };
    const url = `${environment.apiUrl}/api/payments/slots?promoteType=${PromoteType.CATEGORY_SLIDER}&categorySlug=${this.selectedCategory}`;

    this.http
      .get<{
        available: boolean;
        usedSlots: number;
        remainingSlots: number;
        totalSlots: number;
      }>(url, { headers })
      .subscribe({
        next: (res) => {
          this.categorySliderAvailable = res.remainingSlots > 0;
          this.availableSlots['CATEGORY_SLIDER'] = res.remainingSlots;
          if (!environment.production) {
            console.log(
              `CATEGORY_SLIDER remaining in ${this.selectedCategory}: ${res.remainingSlots}`
            );
          }
        },
        error: () => {
          if (!environment.production) {
            console.error('Failed to check CATEGORY_SLIDER slots');
          }
        },
      });
  }

  async pay(plan: PromoteType): Promise<void> {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user?.username || !user?.accessToken) {
      alert('🔐 You must log in with Pi Network to continue.');
      if (typeof Pi !== 'undefined') {
        Pi.authenticate(
          (res: any) => {
            localStorage.setItem(
              'user',
              JSON.stringify({
                username: res.user.username,
                accessToken: res.accessToken,
              })
            );
            alert('✅ Login successful. Please retry your payment.');
            location.reload();
          },
          (error: any) => {
            alert('❌ Login failed. Please try again inside the Pi Browser.');
            console.error('Pi login error:', error);
          }
        );
      } else {
        alert('⚠️ Pi SDK not available. Please use the Pi Browser to log in.');
      }
      return;
    }

    // 🧠 Detección de entorno
    //const isPiBrowser = navigator.userAgent.includes('PiBrowser'); // Para Producción
    const isPiBrowser = true; // 🔧 Forzar entorno Pi Browser para pruebas

    console.log('Entorno detectado:', isPiBrowser ? 'PiBrowser' : 'Escritorio'); // Depuración

    // 🌐 Modo SANDBOX (solo en Pi Browser o para usuarios específicos)
    if (
      (environment.sandbox || user.username === 'sandbox-user') &&
      isPiBrowser
    ) {
      console.log('Modo sandbox activado, simulando pago'); // Depuración
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
            alert('Sandbox mode active. Simulating payment without SDK.');
            localStorage.setItem('pendingPaymentId', fakePaymentId);

            const headers = {
              Authorization: `Bearer ${user.accessToken}`,
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
          },
          error: () => {
            alert('Failed to initiate payment in sandbox mode.');
          },
        });
      return;
    }

    // Crear el pago en el servidor
    const payload = {
      planType: plan,
      username: user.username,
      paymentId: `payment-${Date.now()}`,
    };

    this.http
      .post(`${environment.apiUrl}/api/payments/create`, payload)
      .subscribe({
        next: async (payment: any) => {
          console.log('Pago creado en servidor:', payment); // Depuración
          if (isPiBrowser) {
            console.log('Ejecutando pago en Pi Browser'); // Depuración
            if (typeof Pi === 'undefined') {
              console.error('Pi SDK no disponible en Pi Browser');
              alert('⚠️ Pi SDK no disponible. Por favor, usa el Pi Browser.');
              return;
            }
            Pi.createPayment(payment, {
              onReadyForServerApproval: (paymentId: string) => {
                localStorage.setItem('pendingPaymentId', paymentId);
                const headers = {
                  Authorization: `Bearer ${user.accessToken}`,
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
                  .subscribe();
              },
              onReadyForServerCompletion: (paymentId: string, txid: string) => {
                const headers = {
                  Authorization: `Bearer ${user.accessToken}`,
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
                      alert(`Payment completed successfully for plan ${plan}!`);
                      this.router.navigate(['/user-dashboard/create-article']);
                    },
                    error: () => {
                      alert('Failed to complete payment. Please try again.');
                    },
                  });
              },
              onCancel: () => {
                alert('Payment was cancelled or timed out.');
                localStorage.removeItem('pendingPaymentId');
              },
              onError: (error: any) => {
                console.error('Payment error:', error);
                alert('An error occurred while processing the payment.');
                localStorage.removeItem('pendingPaymentId');
              },
            });
          } else {
            console.log('Generando QR para escritorio'); // Depuración
            try {
              this.showQr = false; // Reiniciar estado
              this.qrUrl = `https://pi-browser.app/rollingpi/payment-qr?paymentId=${payment.paymentId}&plan=${plan}`;
              this.qrDataUrl = await QRCode.toDataURL(this.qrUrl, {
                width: 256,
                margin: 1,
              });
              this.showQr = true;
              if (this.isChecking) return; // 🔁 Evita múltiples intervalos
              this.isChecking = true;
              this.qrCheckInterval = setInterval(() => {
                const paymentId = payment.paymentId;
                const headers = {
                  Authorization: `Bearer ${user.accessToken}`,
                  'Content-Type': 'application/json',
                };

                this.http;
                this.http
                  .get(
                    `${environment.apiUrl}/api/payments/by-payment-id/${payment.paymentId}`
                  )

                  .subscribe({
                    next: () => {
                      clearInterval(this.qrCheckInterval);
                      this.qrCheckInterval = null;
                      this.isChecking = false; // 💡 Asegura que se pueda volver a lanzar en futuros pagos
                      this.showQr = false;
                      alert('✅ Payment confirmed from Pi Browser!');
                      this.router.navigate(['/user-dashboard/create-article']);
                    },

                    error: () => {
                      // Optional: log or ignore until confirmed
                    },
                  });
              }, 3000); // Check every 3 seconds
              console.log('QR generado:', this.qrUrl, 'showQr:', this.showQr); // Depuración
            } catch (error) {
              console.error('Error generando QR:', error);
              alert('No se pudo generar el código QR. Intenta de nuevo.');
              this.showQr = false;
            }
          }
        },
        error: (err) => {
          console.error('Error al crear pago:', err); // Depuración
          alert('No se pudo iniciar el pago. Intenta de nuevo.');
        },
      });
  }

  openConfirmModal(plan: PromoteType): void {
    this.selectedPlan = plan;
    this.showConfirmModal = true;
  }

  confirmPayment(): void {
    if (this.selectedPlan) {
      this.pay(this.selectedPlan);
      this.showConfirmModal = false;
    }
  }

  cancelPayment(): void {
    this.showConfirmModal = false;
    this.selectedPlan = null;
    if (this.qrCheckInterval) {
      clearInterval(this.qrCheckInterval);
      this.qrCheckInterval = null;
    }
    this.isChecking = false;
    this.showQr = false;
  }

  fetchPlanPricesInPi(): void {
    this.http
      .get<{ [key: string]: number }>(`${environment.apiUrl}/api/price`)
      .subscribe({
        next: (prices) => {
          this.standardPricePi = prices['STANDARD'];
          this.categoryPricePi = prices['CATEGORY_SLIDER'];
          this.mainPricePi = prices['MAIN_SLIDER'];
        },
        error: () => {
          if (!environment.production) {
            console.error('Failed to fetch PI prices');
          }
        },
      });
  }

  handleConfirm(): void {
    if (!this.acceptedTerms) {
      this.showTermsError = true;
      return;
    }

    this.showTermsError = false;
    this.confirmPayment();
  }
}
