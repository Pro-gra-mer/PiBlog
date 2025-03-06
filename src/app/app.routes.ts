import { Routes } from '@angular/router';
import { AdvertiseWithUsComponent } from './components/advertise-with-us/advertise-with-us.component';
import { HomeComponent } from './components/home/home.component';
import { ContactComponent } from './components/contact/contact.component';
import { UserDashboardComponent } from './dashboards/user/user-dashboard/user-dashboard.component';
import { CreateArticleComponent } from './dashboards/user/create-article/create-article.component';
import { MyArticlesComponent } from './dashboards/user/my-articles/my-articles.component';
import { SubscriptionComponent } from './dashboards/user/subscription/subscription.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Esto debería funcionar como la home
  { path: '', redirectTo: '/user-dashboard', pathMatch: 'full' }, // Esta línea sobrescribe la anterior

  { path: 'advertise', component: AdvertiseWithUsComponent },
  { path: 'contact', component: ContactComponent },
  {
    path: 'user-dashboard',
    component: UserDashboardComponent, // Contenedor del dashboard
    children: [
      { path: 'create-article', component: CreateArticleComponent },
      { path: 'my-articles', component: MyArticlesComponent },
      { path: 'subscription', component: SubscriptionComponent },
      { path: '', redirectTo: 'create-article', pathMatch: 'full' }, // Redirección inicial
    ],
  },
];
