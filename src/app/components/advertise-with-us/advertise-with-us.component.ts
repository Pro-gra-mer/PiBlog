import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment.dev';

import { Router } from '@angular/router';
import { PromoteType } from '../../models/PromoteType';
import { Category, CategoryService } from '../../services/category.service';
import { FormsModule } from '@angular/forms';

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

  ngOnInit(): void {
    this.checkSlots();
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
        // Establece la primera como predeterminada si quieres
        if (data.length > 0) {
          this.selectedCategory = data[0].slug || '';
          this.checkCategorySliderSlot();
        }
      },
      error: (err) => console.error('Error fetching categories', err),
    });

    this.checkMainSliderSlot(); // también puedes mover esto a parte
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
          console.log(`✅ MAIN_SLIDER remaining:`, res.remainingSlots);
        },
        error: (err) => {
          console.error(`❌ Error checking MAIN_SLIDER slots:`, err);
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
          console.log(
            `✅ CATEGORY_SLIDER remaining in ${this.selectedCategory}:`,
            res.remainingSlots
          );
        },
        error: (err) => {
          console.error(`❌ Error checking CATEGORY_SLIDER slots:`, err);
        },
      });
  }

  checkSlots(): void {
    if (typeof window === 'undefined') return;

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    const headers = {
      Authorization: `Bearer ${user.accessToken}`,
    };

    const types: PromoteType[] = [
      PromoteType.MAIN_SLIDER,
      PromoteType.CATEGORY_SLIDER,
    ];

    const categorySlug = 'sin-categoria'; // o el que uses por defecto

    types.forEach((type) => {
      let url = `${environment.apiUrl}/api/payments/slots?promoteType=${type}`;

      if (type === PromoteType.CATEGORY_SLIDER) {
        url += `&categorySlug=${categorySlug}`;
      }

      this.http
        .get<{
          available: boolean;
          usedSlots: number;
          remainingSlots: number;
          totalSlots: number;
        }>(url, { headers })
        .subscribe({
          next: (res) => {
            console.log(`✅ ${type} remaining:`, res.remainingSlots);
            this.availableSlots[type] = res.remainingSlots;
            if (type === PromoteType.MAIN_SLIDER) {
              this.mainSliderAvailable = res.remainingSlots > 0;
            }
            if (type === PromoteType.CATEGORY_SLIDER) {
              this.categorySliderAvailable = res.remainingSlots > 0;
            }
          },
          error: (err) => {
            console.error(`❌ Error checking slots for ${type}:`, err);
          },
        });
    });
  }

  pay(plan: PromoteType): void {
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
  }
}
