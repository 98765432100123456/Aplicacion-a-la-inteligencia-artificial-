import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { resetDemoData } from './core/demo/demo-api.interceptor';
import { Toasts } from './shared/components/toasts/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly demo = environment.demo;

  protected reset() {
    resetDemoData();
    sessionStorage.clear();
    location.href = '/ingresar';
  }
}
