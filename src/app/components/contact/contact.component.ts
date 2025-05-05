import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';
import { environment } from '../../environments/environment.dev';

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
    if (!environment.production) {
      console.log('ContactComponent initialized');
    }
  }

  onSubmit(): void {
    if (!environment.production) {
      console.log('Form submitted', {
        valid: this.contactForm.valid,
      });
    }
    this.submitted = true;
    this.showSuccessMessage = false;
    this.errorMessage = null;

    if (this.contactForm.invalid) {
      if (!environment.production) {
        console.log('Form invalid', this.contactForm.errors);
      }
      return;
    }

    this.contactService.sendMessage(this.contactForm.value).subscribe({
      next: (response) => {
        if (!environment.production) {
          console.log('Server response:', response);
        }
        this.showSuccessMessage = true;
        this.contactForm.reset();
        this.submitted = false;

        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 3000);
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to send message');
        }
        this.errorMessage = 'Failed to send message. Please try again.';
      },
    });
  }
}
