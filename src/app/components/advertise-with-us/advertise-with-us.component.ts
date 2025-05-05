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
  piPriceUsd: number = 1;
  standardPricePi!: number;
  categoryPricePi!: number;
  mainPricePi!: number;

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

  pay(plan: PromoteType): void {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      if (!environment.production) {
        console.warn('User not authenticated');
      }
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
            alert('Sandbox mode active. Simulating payment without SDK.');
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

          // Production
          if (typeof Pi === 'undefined') {
            if (!environment.production) {
              console.error('Pi SDK not available');
            }
            alert('Payment SDK unavailable. Please try again later.');
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
                  next: () => {
                    if (!environment.production) {
                      console.log('Payment approved');
                    }
                  },
                  error: () => {
                    if (!environment.production) {
                      console.error('Failed to approve payment');
                    }
                    alert('Failed to process payment. Please try again.');
                  },
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
                    alert(`Payment completed successfully for plan ${plan}!`);
                    this.router.navigate(['/user-dashboard/create-article']);
                  },
                  error: () => {
                    if (!environment.production) {
                      console.error('Failed to complete payment');
                    }
                    alert('Failed to complete payment. Please try again.');
                  },
                });
            },

            onCancel: (paymentId: string) => {
              if (!environment.production) {
                console.warn('Payment cancelled');
              }
              alert('Payment was cancelled or timed out.');
              localStorage.removeItem('pendingPaymentId');
            },

            onError: (error: any, paymentId: string) => {
              if (!environment.production) {
                console.error('Payment error', error);
              }
              alert('An error occurred while processing the payment.');
              localStorage.removeItem('pendingPaymentId');
            },
          });
        },
        error: () => {
          if (!environment.production) {
            console.error('Failed to create payment');
          }
          alert('Failed to initiate payment. Please try again.');
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
}
