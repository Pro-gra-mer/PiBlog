import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { PaymentService } from '../../../services/payment.service';
import { Article } from '../../../models/Article.model';
import { PiAuthService } from '../../../services/pi-auth.service';
import { environment } from '../../../environments/environment.dev';
import { HttpClient } from '@angular/common/http';
import QRCode from 'qrcode';

@Component({
  selector: 'app-my-articles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-articles.component.html',
  styleUrls: ['./my-articles.component.css'],
})
export class MyArticlesComponent implements OnInit, OnDestroy {
  articles: Article[] = [];
  loading = true;
  error: string | null = null;
  today = new Date();
  showPlanModal = false;
  isPromoteMode = false;
  selectedArticleId: number | null = null;
  selectedPlanType: string | null = null;
  mainSliderInfo: any = null;
  categorySliderInfo: any = null;
  isAdmin = false;
  successMessage: string | null = null;
  standardPricePi!: number;
  categoryPricePi!: number;
  mainPricePi!: number;
  qrImageUrl: string | null = null;
  qrUrl: string | null = null;
  private paymentCheckInterval: any = null;

  confirmationModal = {
    visible: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: () => {},
  };

  constructor(
    private articleService: ArticleService,
    private paymentService: PaymentService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private piAuthService: PiAuthService
  ) {}

  ngOnInit(): void {
    this.fetchPlanPricesInPi();
    this.isAdmin = this.piAuthService.isAdmin();
    console.log('Initial isAdmin value:', this.isAdmin);
    this.articleService.getUserPublishedArticles().subscribe({
      next: (articles) => {
        this.articles = articles.filter((article) => article.id != null);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load published articles');
        }
        this.error = 'Failed to load published articles.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.paymentCheckInterval) {
      clearInterval(this.paymentCheckInterval);
      this.paymentCheckInterval = null;
      console.log('Payment check interval cleared on component destroy');
    }
  }

  openModal(article: Article, action: string): void {
    this.selectedArticleId = article.id!;
    this.isPromoteMode = action === 'promote';
    const categorySlug = article.category?.slug || null;

    this.paymentService.getSlotInfo('MAIN_SLIDER', null).subscribe({
      next: (mainSliderData) => {
        this.mainSliderInfo = mainSliderData;
        this.paymentService
          .getSlotInfo('CATEGORY_SLIDER', categorySlug)
          .subscribe({
            next: (categorySliderData) => {
              this.categorySliderInfo = categorySliderData;
              this.showPlanModal = true;
              this.cdr.detectChanges();
            },
            error: () => {
              if (!environment.production) {
                console.error('Failed to load category slider info');
              }
              this.error = 'Failed to load plan information.';
              this.cdr.detectChanges();
            },
          });
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load main slider info');
        }
        this.error = 'Failed to load plan information.';
        this.cdr.detectChanges();
      },
    });
  }

  openActivateModal(article: Article, planType: string): void {
    this.selectedArticleId = article.id!;
    this.selectedPlanType = planType;

    if (planType === 'CATEGORY_SLIDER' && !article.category?.slug) {
      this.error = 'This article does not have a category assigned.';
      this.cdr.detectChanges();
      return;
    }

    this.showPlanModal = true;
    this.isPromoteMode = false;
    this.loadPlanInfo(planType);
  }

  loadPlanInfo(planType: string): void {
    const article = this.articles.find((a) => a.id === this.selectedArticleId);
    const categorySlug = article?.category?.slug || null;

    if (!categorySlug && planType === 'CATEGORY_SLIDER') {
      this.error = 'No valid category found for this article.';
      this.cdr.detectChanges();
      return;
    }

    this.paymentService.getSlotInfo(planType, categorySlug).subscribe({
      next: (response) => {
        if (planType === 'MAIN_SLIDER') {
          this.mainSliderInfo = response;
        } else if (planType === 'CATEGORY_SLIDER') {
          this.categorySliderInfo = response;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load plan information');
        }
        this.error = 'Failed to load plan information.';
        this.cdr.detectChanges();
      },
    });
  }

  handlePlanSelection(planType: string): void {
    if (!this.selectedArticleId) return;

    const selectedArticle = this.articles.find(
      (a) => a.id === this.selectedArticleId
    );
    if (!selectedArticle) return;

    const categorySlug = selectedArticle.category?.slug?.trim() || null;

    if (!categorySlug && planType === 'CATEGORY_SLIDER') {
      this.error = 'This article does not have a valid category.';
      this.cdr.detectChanges();
      return;
    }

    console.log('Is Admin:', this.isAdmin);
    console.log('Starting payment flow for plan:', planType);

    // Detener cualquier intervalo existente
    if (this.paymentCheckInterval) {
      clearInterval(this.paymentCheckInterval);
      this.paymentCheckInterval = null;
      console.log('Previous payment check interval cleared');
    }

    const applyPlanToArticle = (response: any) => {
      const expirationAt =
        response?.expirationAt ||
        new Date(new Date().setDate(new Date().getDate() + 30)).toISOString();
      const newPlan = { planType, expirationAt };

      if (
        selectedArticle.activePlans &&
        Array.isArray(selectedArticle.activePlans)
      ) {
        const existingIndex = selectedArticle.activePlans.findIndex(
          (p) => p.planType === planType
        );
        if (existingIndex !== -1) {
          selectedArticle.activePlans[existingIndex] = newPlan;
        } else {
          selectedArticle.activePlans.push(newPlan);
        }
      } else {
        selectedArticle.activePlans = [newPlan];
      }

      this.successMessage = `${planType.replace(
        '_',
        ' '
      )} activated successfully!`;
      setTimeout(() => (this.successMessage = null), 4000);
      this.cdr.detectChanges();
      this.closePlanModal();
    };

    if (this.isAdmin) {
      console.log('Admin flow: activating plan without payment');
      this.paymentService
        .activatePlanAsAdmin(this.selectedArticleId, planType, categorySlug)
        .subscribe({
          next: applyPlanToArticle,
          error: () => {
            if (!environment.production)
              console.error('Failed to activate plan as admin');
            this.error = 'Failed to activate plan as admin.';
            this.closePlanModal();
          },
        });
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const paymentPayload = {
      planType,
      username: user.username,
      paymentId: 'pi-' + Date.now(),
    };

    const headers = {
      Authorization: `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    };

    console.log('Creating payment with payload:', paymentPayload);

    this.http
      .post(`${environment.apiUrl}/api/payments/create`, paymentPayload, {
        headers,
      })
      .subscribe({
        next: async (payment: any) => {
          const isPiBrowser = navigator.userAgent.includes('PiBrowser');
          console.log('Is Pi Browser:', isPiBrowser);

          if (!isPiBrowser || typeof Pi === 'undefined') {
            try {
              const qrUrl = `https://pi-browser.app/rollingpi/payment-qr?paymentId=${paymentPayload.paymentId}&plan=${planType}&articleId=${this.selectedArticleId}`;
              const qrImageUrl = await QRCode.toDataURL(qrUrl, {
                width: 256,
                margin: 1,
              });

              this.qrUrl = qrUrl;
              this.qrImageUrl = qrImageUrl;
              console.log('QR generated:', qrUrl);

              this.paymentCheckInterval = setInterval(() => {
                this.http
                  .get(
                    `${environment.apiUrl}/api/payments/by-payment-id/${paymentPayload.paymentId}`,
                    { headers }
                  )
                  .subscribe({
                    next: (res: any) => {
                      console.log(
                        `Payment status for ${paymentPayload.paymentId}:`,
                        res?.status || 'Unknown'
                      );
                      if (res && res.status === 'COMPLETED') {
                        clearInterval(this.paymentCheckInterval);
                        this.paymentCheckInterval = null;
                        alert('✅ Payment completed from Pi Browser!');
                        applyPlanToArticle(res);
                      } else if (res && res.status) {
                        console.log(`Payment still in status: ${res.status}`);
                      }
                    },
                    error: (err) => {
                      console.error(
                        `Error checking payment ${paymentPayload.paymentId}:`,
                        err
                      );
                      if (err.status !== 404) {
                        clearInterval(this.paymentCheckInterval);
                        this.paymentCheckInterval = null;
                        this.error = 'Failed to verify payment status.';
                        this.cdr.detectChanges();
                      }
                    },
                  });
              }, 3000);
            } catch (error) {
              console.error('Error generating QR:', error);
              alert('Error generating QR. Try again.');
              this.closePlanModal();
            }
            return;
          }

          console.log('Pi Browser flow: initiating payment');
          Pi.createPayment(payment, {
            onReadyForServerApproval: (paymentId: string) => {
              console.log('Approving payment:', paymentId);
              this.http
                .post(
                  `${environment.apiUrl}/api/payments/approve`,
                  { paymentId, planType },
                  { headers }
                )
                .subscribe({
                  error: (err) =>
                    console.error('Error approving payment:', err),
                });
            },
            onReadyForServerCompletion: (paymentId: string, txid: string) => {
              console.log('Completing payment:', paymentId, 'with txid:', txid);
              this.http
                .post(
                  `${environment.apiUrl}/api/payments/complete`,
                  { paymentId, txid, articleId: this.selectedArticleId },
                  { headers }
                )
                .subscribe({
                  next: applyPlanToArticle,
                  error: () => {
                    this.error = 'Failed to complete payment.';
                    this.closePlanModal();
                  },
                });
            },
            onCancel: () => {
              alert('Payment was cancelled.');
              this.closePlanModal();
            },
            onError: () => {
              alert('Error occurred during payment.');
              this.closePlanModal();
            },
          });
        },
        error: () => {
          this.error = 'Failed to create payment.';
          this.closePlanModal();
        },
      });
  }

  closePlanModal(): void {
    if (this.paymentCheckInterval) {
      clearInterval(this.paymentCheckInterval);
      this.paymentCheckInterval = null;
      console.log('Payment check interval cleared on modal close');
    }
    this.showPlanModal = false;
    this.selectedArticleId = null;
    this.selectedPlanType = null;
    this.qrImageUrl = null;
    this.qrUrl = null;
    this.error = null;
    this.cdr.detectChanges();
  }

  openConfirmationModal(
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel: string = 'Confirm'
  ): void {
    this.confirmationModal = {
      visible: true,
      title,
      message,
      confirmLabel,
      cancelLabel: 'Cancel',
      onConfirm,
    };
    this.cdr.detectChanges();
  }

  openDeleteModal(id: number): void {
    this.openConfirmationModal(
      'Delete Article',
      'Are you sure you want to delete this published article?',
      () => this.confirmDelete(id),
      'Yes, delete'
    );
  }

  confirmDelete(id: number): void {
    this.articleService.deleteArticleWithCleanup(id).subscribe({
      next: () => {
        this.articles = this.articles.filter((a) => a.id !== id);
        this.confirmationModal.visible = false;
        this.successMessage = 'Article deleted successfully.';
        setTimeout(() => (this.successMessage = null), 3000);
        this.cdr.detectChanges();
        this.cdr.markForCheck();
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to delete article');
        }
        this.error = 'Failed to delete article.';
        this.confirmationModal.visible = false;
        this.cdr.detectChanges();
      },
    });
  }

  isExpired(expirationAt: string | null | undefined): boolean {
    if (!expirationAt) return false;
    const expirationDate = new Date(expirationAt);
    return expirationDate < new Date();
  }

  hasActivePlanType(article: Article, planType: string): boolean {
    return (
      article.activePlans?.some(
        (plan) =>
          plan.planType === planType && !this.isExpired(plan.expirationAt)
      ) || false
    );
  }

  fetchPlanPricesInPi(): void {
    this.paymentService.getPlanPricesInUsd().subscribe({
      next: (prices) => {
        this.standardPricePi = prices['STANDARD'];
        this.categoryPricePi = prices['CATEGORY_SLIDER'];
        this.mainPricePi = prices['MAIN_SLIDER'];
        this.cdr.detectChanges();
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to fetch PI prices');
        }
      },
    });
  }

  closeQrModal(): void {
    this.qrImageUrl = null;
    this.qrUrl = null;
    this.cdr.detectChanges();
  }
}
