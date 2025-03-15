import { Routes } from '@angular/router';
import { AdvertiseWithUsComponent } from './components/advertise-with-us/advertise-with-us.component';
import { HomeComponent } from './components/home/home.component';
import { ContactComponent } from './components/contact/contact.component';
import { UserDashboardComponent } from './dashboards/user/user-dashboard/user-dashboard.component';
import { CreateArticleComponent } from './dashboards/user/create-article/create-article.component';
import { MyArticlesComponent } from './dashboards/user/my-articles/my-articles.component';
import { SubscriptionComponent } from './dashboards/user/subscription/subscription.component';
import { AdminDashboardComponent } from './dashboards/admin/admin-dashboard/admin-dashboard.component'; // Importa el nuevo componente

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'advertise', component: AdvertiseWithUsComponent },
  { path: 'contact', component: ContactComponent },

  {
    path: 'user-dashboard',
    component: UserDashboardComponent,
    children: [
      { path: 'create-article', component: CreateArticleComponent },
      { path: 'my-articles', component: MyArticlesComponent },
      { path: 'subscription', component: SubscriptionComponent },
      { path: '', redirectTo: 'create-article', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,

    children: [
      { path: 'create-article', component: CreateArticleComponent },
      { path: 'my-articles', component: MyArticlesComponent },
    ],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
