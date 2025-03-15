import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, RouterModule], // Configuración del módulo
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent {
  sidebarOpen = false; // Sidebar oculto por defecto en móviles

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen; // Cambia entre visible y oculto
  }
}
