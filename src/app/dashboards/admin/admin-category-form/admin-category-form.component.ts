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
import { environment } from '../../../environments/environment.dev';

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
      slug: [''],
      description: [''],
      emoji: [''],
      headerImage: [''],
    });
  }

  // Initializes component and loads categories
  ngOnInit(): void {
    this.loadCategories();
  }

  // Loads all categories from service
  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load categories');
        }
      },
    });
  }

  // Submits form to create or update category
  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    const { name, description, emoji, headerImage } = this.categoryForm.value;
    let slug = this.categoryForm.value.slug?.trim() || '';

    const generatedSlug = this.generateSlug(name);

    const isEditing = !!this.selectedCategory;
    const nameChanged = isEditing && this.selectedCategory?.name !== name;
    const slugManuallyEdited =
      isEditing && this.selectedCategory?.slug !== slug;

    // Preservar el slug original si no se cambió el nombre ni se editó manualmente
    if (isEditing && !nameChanged && slug && slugManuallyEdited) {
      slug = this.selectedCategory?.slug || generatedSlug;
    } else if (!slug || nameChanged) {
      slug = generatedSlug;
    }

    const payload = { name, slug, description, emoji, headerImage };

    if (this.selectedCategory?.id !== undefined) {
      this.categoryService
        .updateCategory(this.selectedCategory.id, payload)
        .subscribe({
          next: () => {
            this.message = 'Category updated successfully!';
            this.cancelEdit();
            this.loadCategories();
          },
          error: () => {
            if (!environment.production) {
              console.error('Failed to update category');
            }
            this.message = 'Failed to update category. Please try again.';
          },
        });
    } else {
      this.categoryService.createCategory(payload).subscribe({
        next: () => {
          this.message = 'Category created successfully!';
          this.categoryForm.reset();
          this.loadCategories();
        },
        error: () => {
          if (!environment.production) {
            console.error('Failed to create category');
          }
          this.message = 'Failed to create category. Please try again.';
        },
      });
    }
  }

  // Sets category for editing
  editCategory(category: Category): void {
    this.selectedCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      slug: category.slug || this.generateSlug(category.name),
      description: category.description || '',
      emoji: category.emoji || '',
      headerImage: category.headerImage || '',
    });
  }

  // Deletes category after confirmation
  deleteCategory(id: number): void {
    if (!confirm('Are you sure you want to delete this category?')) return;

    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.message = 'Category deleted.';
        this.loadCategories();
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to delete category');
        }
        this.message = 'Failed to delete category. Please try again.';
      },
    });
  }

  // Opens delete confirmation dialog
  confirmDelete(category: Category): void {
    this.categoryToDelete = category;
    this.showConfirmDelete = true;
  }

  // Proceeds with category deletion
  proceedDelete(): void {
    if (!this.categoryToDelete?.id) return;

    this.categoryService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.message = 'Category deleted.';
        this.loadCategories();
        this.closeConfirmDelete();
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to delete category');
        }
        this.message = 'Failed to delete category. Please try again.';
      },
    });
  }

  // Cancels category editing
  cancelEdit(): void {
    this.selectedCategory = null;
    this.categoryForm.reset();
  }

  // Closes delete confirmation dialog
  closeConfirmDelete(): void {
    this.showConfirmDelete = false;
    this.categoryToDelete = null;
  }

  generateSlug(name: string): string {
    console.log('Input name:', name);
    let result = name.toLowerCase().trim();
    console.log('After toLowerCase and trim:', result);
    result = result.replace(/&/g, 'and');
    console.log('After replacing & with and:', result);
    result = result.replace(/[^a-z0-9]+/g, '-');
    console.log('After replacing non-alphanumeric with -:', result);
    result = result.replace(/^-+|-+$/g, '');
    console.log('After removing leading/trailing -:', result);
    result = result.replace(/-{2,}/g, '-');
    console.log('After removing multiple -:', result);
    return result;
  }
}
