import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CategoryService, Category } from '../../services/category.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  showCategories = false;
  categories: Category[] = [];

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories', err);
      },
    });
  }

  getCategoryName(slug: string): string {
    const category = this.categories.find((c) => c.slug === slug);
    return category ? category.name : slug;
  }
}
