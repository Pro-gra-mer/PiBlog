import { Component } from '@angular/core';
import { HeroComponent } from '../hero/hero.component';
import { SliderComponent } from '../slider/slider.component';
import { ArticleListComponent } from '../article-list/article-list.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    SliderComponent,
    ArticleListComponent,
    SidebarComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
