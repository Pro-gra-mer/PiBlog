import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.css',
})
export class SubscriptionComponent {
  selectVideoModal = false;
  userVideos = [
    { id: 1, url: 'https://example.com/video1.mp4', title: 'My First App' },
    { id: 2, url: 'https://example.com/video2.mp4', title: 'New Update' },
  ]; // Esto vendrá del backend

  selectedPlan: any = null;
  currentSubscription = {
    name: 'Category Slider',
    price: 15,
  };

  availableUpgrades = [{ id: 2, name: 'Main Slider', price: 25 }];

  upgradeSubscription(planId: number) {
    console.log('Upgrading to plan:', planId);
    // Aquí iría la lógica para actualizar la suscripción
  }

  confirmUpgrade(video: any) {
    console.log(
      `Upgrading to plan: ${this.selectedPlan.name} with video: ${video.title}`
    );
    this.selectVideoModal = false;
    // Aquí enviarías la solicitud al backend con el plan y el video seleccionado
  }

  closeModal() {
    this.selectVideoModal = false;
  }
}
