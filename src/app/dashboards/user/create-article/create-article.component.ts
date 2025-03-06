import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill'; // Editor de texto enriquecido

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, QuillModule], // Configuración del módulo
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.css'],
})
export class CreateArticleComponent {
  articleForm: FormGroup; // Formulario para los datos del artículo
  message: string | null = null; // Mensaje para notificar al usuario
  @ViewChild('quillEditor', { static: false }) quillEditor: any; // Referencia al editor Quill

  categories = [
    'Marketplaces',
    'Productivity Tools',
    'Education',
    'Social & Community',
    'Digital Services',
    'Games',
  ];

  constructor(private formBuilder: FormBuilder) {
    this.articleForm = this.formBuilder.group({
      company: ['', [Validators.required]],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      category: ['', [Validators.required]], // Asegúrate de agregarlo aquí
      content: ['', [Validators.required]],
      publishDate: [
        new Date().toISOString().split('T')[0],
        Validators.required,
      ],
    });
  }

  onSubmit(): void {
    if (this.articleForm.invalid) {
      this.message = 'Por favor, completa todos los campos correctamente.';
      return;
    }
    console.log('Artículo enviado:', this.articleForm.value);
  }

  handleImageUpload() {}

  onEditorCreated(quillInstance: any): void {
    import('quill')
      .then(() => {
        const toolbar = quillInstance.getModule('toolbar');
        toolbar.addHandler('image', this.handleImageUpload.bind(this)); // Manejador para imágenes
      })
      .catch((error) => {
        console.error('Error loading Quill:', error);
        this.message = 'No se pudo inicializar el editor.';
      });
  }
}
