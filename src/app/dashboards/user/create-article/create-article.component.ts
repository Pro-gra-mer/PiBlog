import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill'; // Editor de texto enriquecido

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, QuillModule],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.css'],
})
export class CreateArticleComponent {
  articleForm: FormGroup; // Formulario para los datos del artículo
  message: string | null = null; // Mensaje para notificar al usuario
  // Simulación del estado de suscripción del usuario.
  // En una aplicación real, este valor provendría de un servicio.
  userSubscribed: boolean = false;
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
    // Se agrega el control 'promoteVideo'.
    // Si el usuario no está suscrito (userSubscribed es false), el control se deshabilita.
    this.articleForm = this.formBuilder.group({
      company: ['', [Validators.required]],
      app: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      category: ['', [Validators.required]],
      content: ['', [Validators.required]],
      publishDate: [
        new Date().toISOString().split('T')[0],
        Validators.required,
      ],
      promoteVideo: [{ value: false, disabled: !this.userSubscribed }],
    });
  }

  onSubmit(): void {
    if (this.articleForm.invalid) {
      this.message = 'Por favor, completa todos los campos correctamente.';
      return;
    }
    console.log('Artículo enviado:', this.articleForm.value);
    // Aquí puedes agregar la lógica para enviar el formulario al backend.
  }

  handleImageUpload() {
    // Lógica para subir imágenes desde el editor Quill.
  }

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
