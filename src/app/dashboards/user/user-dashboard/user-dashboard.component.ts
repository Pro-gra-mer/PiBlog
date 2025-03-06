import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [RouterLink, RouterModule], // Configuración del módulo
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
})
export class UserDashboardComponent {
  sidebarOpen = false; // Sidebar oculto por defecto en móviles

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen; // Cambia entre visible y oculto
  }
}
