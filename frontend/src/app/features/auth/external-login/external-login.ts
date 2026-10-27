import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthConfig, Proveedor } from '../../../core/models/predios';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/utils/http-error';
import { rutaDeRegreso } from '../../../core/utils/navegacion';
import { mensajeProveedor, NOMBRE_PROVEEDOR } from './proveedores';

/** Botones para ingresar con Google, Facebook o Microsoft, y enlace de registro para propietarios. */
@Component({
  selector: 'app-external-login',
  imports: [RouterLink],
  templateUrl: './external-login.html',
  styleUrl: './external-login.scss',
})
export class ExternalLogin implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly volver = inject(ActivatedRoute).snapshot.queryParamMap.get('volver');
  protected readonly nombres = NOMBRE_PROVEEDOR;
  protected readonly config = signal<AuthConfig | null>(null);
  protected readonly cargando = signal<Proveedor | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.auth.authConfig().then((c) => this.config.set(c), () => this.config.set(null));
  }

  protected proveedores(): Proveedor[] {
    return this.config()?.providers ?? [];
  }

  protected async ingresar(p: Proveedor) {
    this.error.set(null);
    this.cargando.set(p);
    try {
      await this.auth.loginWithProvider(p);
      await this.router.navigateByUrl(rutaDeRegreso(this.volver));
    } catch (e) {
      const mensaje = mensajeProveedor(e);
      if (mensaje !== null) this.error.set(mensaje ?? errorMessage(e, 'No se pudo ingresar con el proveedor. Intente de nuevo o use su correo y contraseña.'));
    }
    this.cargando.set(null);
  }
}
