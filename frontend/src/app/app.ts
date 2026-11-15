import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { resetDemoData } from './core/demo/demo-api.interceptor';
import { AvisoActualizacion } from './shared/components/aviso-actualizacion/aviso-actualizacion';
import { AvisoCookies } from './shared/components/aviso-cookies/aviso-cookies';
import { Toasts } from './shared/components/toasts/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts, AvisoCookies, AvisoActualizacion],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // La vista previa de claude.ai se ve como la aplicación normal, sin la franja de demostración.
  protected readonly demo = environment.demo && !(environment as { vista?: boolean }).vista;

  protected reset() {
    resetDemoData();
    try {
      sessionStorage.clear();
    } catch {
      // Sin almacenamiento de sesión no hay nada que borrar.
    }
    location.reload();
  }
}
