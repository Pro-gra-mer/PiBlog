import { Routes } from '@angular/router';
import { AdvertiseWithUsComponent } from './components/advertise-with-us/advertise-with-us.component';
import { HomeComponent } from './components/home/home.component';
import { ContactComponent } from './components/contact/contact.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'advertise', component: AdvertiseWithUsComponent },
  { path: 'contact', component: ContactComponent },
];
