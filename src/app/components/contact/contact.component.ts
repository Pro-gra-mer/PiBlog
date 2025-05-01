import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  contactForm: FormGroup;
  submitted = false;
  showSuccessMessage = false;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private contactService: ContactService) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
    console.log('ContactComponent inicializado');
  }

  onSubmit(): void {
    console.log(
      'Formulario enviado',
      this.contactForm.value,
      this.contactForm.valid
    );
    this.submitted = true;
    this.showSuccessMessage = false;
    this.errorMessage = null;

    if (this.contactForm.invalid) {
      console.log('Formulario inválido', this.contactForm.errors);
      return;
    }

    this.contactService.sendMessage(this.contactForm.value).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.showSuccessMessage = true;
        this.contactForm.reset();
        this.submitted = false;
        // Ocultar el mensaje de éxito después de 5 segundos
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 5000);
      },
      error: (err) => {
        console.error('Error al enviar el mensaje:', err);
        this.errorMessage =
          'Error: ' + err.status + ' - ' + (err.error?.error || err.message);
      },
    });
  }
}
