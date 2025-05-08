import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { PaymentService } from '../../../services/payment.service';
import { Article } from '../../../models/Article.model';
import { Router } from '@angular/router';
import { PiAuthService } from '../../../services/pi-auth.service';
import { environment } from '../../../environments/environment.dev';

@Component({
  selector: 'app-my-articles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-articles.component.html',
  styleUrls: ['./my-articles.component.css'],
})
export class MyArticlesComponent implements OnInit {
  articles: Article[] = [];
  loading = true;
  error = '';
  today = new Date();
  showPlanModal = false;
  isPromoteMode = false;
  selectedArticleId: number | null = null;
  selectedPlanType: string | null = null;
  mainSliderInfo: any = null;
  categorySliderInfo: any = null;
  isAdmin = false;
  successMessage: string | null = null;

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
    private router: Router,
    private cdr: ChangeDetectorRef,
    private piAuthService: PiAuthService
  ) {}

  // Initializes component and loads published articles
  ngOnInit(): void {
    this.isAdmin = this.piAuthService.isAdmin();
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

  // Opens modal for promoting or activating plan
  openModal(article: Article, action: string): void {
    this.selectedArticleId = article.id!;
    this.isPromoteMode = action === 'promote';
    const categorySlug = article.category.slug || null;

    this.paymentService.getSlotInfo('MAIN_SLIDER', null).subscribe({
      next: (mainSliderData) => {
        this.mainSliderInfo = mainSliderData;
        this.paymentService
          .getSlotInfo('CATEGORY_SLIDER', categorySlug)
          .subscribe({
            next: (categorySliderData) => {
              this.categorySliderInfo = categorySliderData;
              this.showPlanModal = true;
            },
            error: () => {
              if (!environment.production) {
                console.error('Failed to load category slider info');
              }
              this.error = 'Failed to load plan information.';
            },
          });
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load main slider info');
        }
        this.error = 'Failed to load plan information.';
      },
    });
  }

  // Opens modal for activating a specific plan
  openActivateModal(article: Article, planType: string): void {
    this.selectedArticleId = article.id!;
    this.selectedPlanType = planType;

    if (planType === 'CATEGORY_SLIDER' && !article.category?.slug) {
      this.error = 'This article does not have a category assigned.';
      return;
    }

    this.showPlanModal = true;
    this.isPromoteMode = false;
    this.loadPlanInfo(planType);
  }

  // Loads plan information for a specific plan type
  loadPlanInfo(planType: string): void {
    const article = this.articles.find((a) => a.id === this.selectedArticleId);
    const categorySlug = article?.category?.slug || null;

    if (!categorySlug && planType === 'CATEGORY_SLIDER') {
      this.error = 'No valid category found for this article.';
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
      },
    });
  }

  // Handles plan selection and activation
  handlePlanSelection(planType: string): void {
    if (!this.selectedArticleId) return;

    const selectedArticle = this.articles.find(
      (a) => a.id === this.selectedArticleId
    );
    if (!selectedArticle) return;

    const categorySlug = selectedArticle.category?.slug?.trim() || null;

    if (!categorySlug && planType === 'CATEGORY_SLIDER') {
      this.error = 'This article does not have a valid category.';
      return;
    }

    this.successMessage = `${planType.replace(
      '_',
      ' '
    )} activated successfully!`;

    setTimeout(() => {
      this.successMessage = null;
    }, 4000);

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

      this.cdr.detectChanges();
      this.closePlanModal();
    };

    if (this.isAdmin) {
      this.paymentService
        .activatePlanAsAdmin(this.selectedArticleId, planType, categorySlug)
        .subscribe({
          next: applyPlanToArticle,
          error: () => {
            if (!environment.production) {
              console.error('Failed to activate plan as admin');
            }
            this.error = 'Failed to activate plan as admin.';
            this.closePlanModal();
          },
        });
      return;
    }

    this.paymentService
      .activatePlan(this.selectedArticleId, planType, categorySlug)
      .subscribe({
        next: applyPlanToArticle,
        error: () => {
          if (!environment.production) {
            console.error('Failed to activate plan');
          }
          this.error = `Failed to activate ${planType.replace('_', ' ')}.`;
          this.closePlanModal();
        },
      });
  }

  // Closes plan selection modal
  closePlanModal(): void {
    this.showPlanModal = false;
    this.selectedArticleId = null;
    this.selectedPlanType = null;
  }

  // Opens generic confirmation modal
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
  }

  // Opens modal for deleting an article
  openDeleteModal(id: number): void {
    this.openConfirmationModal(
      'Delete Article',
      'Are you sure you want to delete this published article?',
      () => this.confirmDelete(id),
      'Yes, delete'
    );
  }

  // Confirms and deletes an article
  confirmDelete(id: number): void {
    this.articleService.deleteArticleWithCleanup(id).subscribe({
      next: () => {
        // Update the article list after deletion
        this.articles = this.articles.filter((a) => a.id !== id);

        // Hide the confirmation modal
        this.confirmationModal.visible = false;

        // Set success message

        this.successMessage = 'Article deleted successfully.';
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
        this.cdr.detectChanges();

        // Ensure view updates
        this.cdr.detectChanges(); // Manually trigger change detection after the update
        this.cdr.markForCheck(); // Ensure Angular checks for changes on the next cycle
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

  // Checks if a plan has expired
  isExpired(expirationAt: string | null | undefined): boolean {
    if (!expirationAt) return false;
    const expirationDate = new Date(expirationAt);
    return expirationDate < new Date();
  }

  // Checks if an article has an active plan
  hasActivePlanType(article: Article, planType: string): boolean {
    return (
      article.activePlans?.some(
        (plan) =>
          plan.planType === planType && !this.isExpired(plan.expirationAt)
      ) || false
    );
  }
}
