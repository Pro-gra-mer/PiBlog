import { Routes } from '@angular/router';
import { AdvertiseWithUsComponent } from './components/advertise-with-us/advertise-with-us.component';
import { HomeComponent } from './components/home/home.component';
import { ContactComponent } from './components/contact/contact.component';
import { UserDashboardComponent } from './dashboards/user/user-dashboard/user-dashboard.component';
import { CreateArticleComponent } from './dashboards/user/create-article/create-article.component';
import { MyArticlesComponent } from './dashboards/user/my-articles/my-articles.component';
import { DraftsComponent } from './dashboards/user/drafts/drafts.component';
import { AdminDashboardComponent } from './dashboards/admin/admin-dashboard/admin-dashboard.component'; // Importa el nuevo componente
import { ArticleDetailComponent } from './components/article-detail/article-detail.component';
import { PendingComponent } from './dashboards/user/pending/pending.component';
import { AdminCategoryFormComponent } from './dashboards/admin/admin-category-form/admin-category-form.component';
import { CategoryComponent } from './components/category/category.component';
import { RejectedComponent } from './dashboards/user/rejected/rejected.component';
import { FeaturedArticlesComponent } from './components/featured-articles/featured-articles.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { CookiePolicyComponent } from './components/cookie-policy/cookie-policy.component';
import { TermsOfServiceComponent } from './components/terms-of-service/terms-of-service.component';
import { SessionQrComponent } from './components/session-qr/session-qr.component';
import { LoginQrComponent } from './components/login-qr/login-qr.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'advertise', component: AdvertiseWithUsComponent },
  { path: 'featured-articles', component: FeaturedArticlesComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'articles/:id', component: ArticleDetailComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'cookie-policy', component: CookiePolicyComponent },
  { path: 'terms-of-service', component: TermsOfServiceComponent },

  {
    path: 'category/:slug',
    component: CategoryComponent,
  },

  {
    path: 'user-dashboard',
    component: UserDashboardComponent,
    children: [
      { path: 'create-article', component: CreateArticleComponent },
      { path: 'edit-article/:id', component: CreateArticleComponent },
      { path: 'my-articles', component: MyArticlesComponent },
      { path: 'drafts', component: DraftsComponent },
      { path: 'pending', component: PendingComponent },
      { path: 'rejected', component: RejectedComponent },
      { path: '', redirectTo: 'my-articles', pathMatch: 'full' },
    ],
  },

  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,

    children: [
      { path: 'create-article', component: CreateArticleComponent },
      { path: 'edit-article/:id', component: CreateArticleComponent }, // 👈 añade esto
      { path: 'my-articles', component: MyArticlesComponent },
      { path: 'drafts', component: DraftsComponent },
      { path: 'pending', component: PendingComponent },
      { path: 'admin-category-form', component: AdminCategoryFormComponent },
      { path: '', redirectTo: 'my-articles', pathMatch: 'full' },
    ],
  },
  { path: 'login-qr', component: LoginQrComponent },
  { path: 'session-qr', component: SessionQrComponent },

  { path: '**', redirectTo: '', pathMatch: 'full' },
];
