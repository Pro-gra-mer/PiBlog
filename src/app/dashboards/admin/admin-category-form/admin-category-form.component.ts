import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { CommonModule } from '@angular/common';
import { Category } from '../../../models/Category.model';

@Component({
  selector: 'app-admin-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-category-form.component.html',
  styleUrl: './admin-category-form.component.css',
})
export class AdminCategoryFormComponent implements OnInit {
  categoryForm: FormGroup;
  message: string | null = null;
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  categoryToDelete: Category | null = null;
  showConfirmDelete = false;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories', err);
      },
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    if (this.selectedCategory && this.selectedCategory.id !== undefined) {
      this.categoryService
        .updateCategory(this.selectedCategory.id, this.categoryForm.value)
        .subscribe({
          next: () => {
            this.message = 'Category updated successfully!';
            this.cancelEdit();
            this.loadCategories();
          },
          error: (err) => {
            console.error(err);
            this.message = err.error?.error || 'Error updating category.';
          },
        });
    } else {
      // Modo creación
      this.categoryService.createCategory(this.categoryForm.value).subscribe({
        next: () => {
          this.message = 'Category created successfully!';
          this.categoryForm.reset();
          this.loadCategories();
        },
        error: (err) => {
          console.error(err);
          this.message = err.error?.error || 'Error creating category.';
        },
      });
    }
  }

  editCategory(category: Category): void {
    this.selectedCategory = category;
    this.categoryForm.patchValue({ name: category.name });
  }

  deleteCategory(id: number): void {
    if (!confirm('Are you sure you want to delete this category?')) return;

    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.message = 'Category deleted.';
        this.loadCategories();
      },
      error: (err) => {
        console.error(err);
        this.message = err.error?.error || 'Error deleting category.';
      },
    });
  }

  confirmDelete(category: Category): void {
    this.categoryToDelete = category;
    this.showConfirmDelete = true;
  }

  proceedDelete(): void {
    if (!this.categoryToDelete?.id) return;

    this.categoryService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.message = 'Category deleted.';
        this.loadCategories();
        this.closeConfirmDelete();
      },
      error: (err) => {
        console.error(err);
        this.message = err.error?.error || 'Error deleting category.';
        this.closeConfirmDelete();
      },
    });
  }

  cancelEdit(): void {
    this.selectedCategory = null;
    this.categoryForm.reset();
  }

  closeConfirmDelete(): void {
    this.showConfirmDelete = false;
    this.categoryToDelete = null;
  }
}
