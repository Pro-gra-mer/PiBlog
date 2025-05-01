import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { PaymentService } from '../../../services/payment.service';
import { Article } from '../../../models/Article.model';
import { Router } from '@angular/router';

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

  // Modal genérico de confirmación
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.articleService.getUserPublishedArticles().subscribe({
      next: (articles) => {
        this.articles = articles.filter((article) => article.id != null);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error loading your published articles.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openModal(article: Article, action: string): void {
    this.selectedArticleId = article.id!;
    this.isPromoteMode = action === 'promote';

    const categorySlug = article.category.slug || null;

    this.paymentService
      .getSlotInfo('MAIN_SLIDER', null)
      .subscribe((mainSliderData) => {
        this.mainSliderInfo = mainSliderData;
        this.paymentService
          .getSlotInfo('CATEGORY_SLIDER', categorySlug)
          .subscribe((categorySliderData) => {
            this.categorySliderInfo = categorySliderData;
            this.showPlanModal = true;
          });
      });
  }

  openActivateModal(article: Article, planType: string): void {
    this.selectedArticleId = article.id!;
    this.selectedPlanType = planType;

    if (planType === 'CATEGORY_SLIDER' && !article.category?.slug) {
      alert('Error: Este artículo no tiene una categoría asignada.');
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
      alert('Error: No se encontró la categoría para este artículo.');
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
        alert('Error loading plan information. Please try again.');
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
      alert("Error: This article doesn't have a valid category.");
      return;
    }

    this.paymentService
      .activatePlan(this.selectedArticleId, planType, categorySlug)
      .subscribe({
        next: (response) => {
          const expirationAt =
            response?.expirationAt ||
            new Date(
              new Date().setDate(new Date().getDate() + 30)
            ).toISOString();

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
        },
        error: (err) => {
          alert(`Error activating the plan ${planType}.`);
          this.closePlanModal();
        },
      });
  }

  closePlanModal(): void {
    this.showPlanModal = false;
    this.selectedArticleId = null;
    this.selectedPlanType = null;
  }

  // ✅ Modal de confirmación genérico
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

  // ✅ Abrir modal para eliminar
  openDeleteModal(id: number): void {
    this.openConfirmationModal(
      'Delete Article',
      'Are you sure you want to delete this published article?',
      () => this.confirmDelete(id),
      'Yes, delete'
    );
  }

  // ✅ Confirmar eliminar
  confirmDelete(id: number): void {
    this.articleService.deleteArticleWithCleanup(id).subscribe({
      next: () => {
        this.articles = this.articles.filter((a) => a.id !== id);
        this.confirmationModal.visible = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Could not delete the article.';
        this.confirmationModal.visible = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ✅ Abrir modal para cancelar suscripción
  openCancelModal(article: Article, planType: string): void {
    const plan = article.activePlans?.find((p) => p.planType === planType);
    if (!plan) return;

    const date = new Date(plan.expirationAt).toLocaleDateString();
    this.openConfirmationModal(
      'Cancel Subscription',
      `Your subscription will remain active until ${date}.`,
      () => this.confirmCancel(article, planType)
    );
  }

  // ✅ Confirmar cancelación de suscripción
  confirmCancel(article: Article, planType: string): void {
    this.articleService.cancelSubscription(article.id, planType).subscribe({
      next: () => {
        const plan = article.activePlans?.find((p) => p.planType === planType);
        if (plan) plan.cancelled = true;
        this.confirmationModal.visible = false;
      },
      error: () => {
        alert('Failed to cancel the subscription.');
        this.confirmationModal.visible = false;
      },
    });
  }

  // Utilidades
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
}
