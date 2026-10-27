import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthConfig } from '../../../core/models/predios';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeFirebase, NOMBRE_PROVEEDOR, Proveedor, tokenDeProveedor } from '../../../core/services/firebase-login';
import { errorMessage } from '../../../core/utils/http-error';
import { rutaDeRegreso } from '../../../core/utils/navegacion';

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
    return (this.config()?.firebase?.providers ?? []).filter((p): p is Proveedor => p in NOMBRE_PROVEEDOR);
  }

  protected async ingresar(p: Proveedor) {
    this.error.set(null);
    this.cargando.set(p);
    try {
      await this.auth.loginWithFirebase(await tokenDeProveedor(this.config()!.firebase!, p));
      await this.router.navigateByUrl(rutaDeRegreso(this.volver));
    } catch (e) {
      const firebase = mensajeFirebase(e);
      if (firebase !== null || !(e as { code?: string })?.code) this.error.set(firebase ?? errorMessage(e));
    }
    this.cargando.set(null);
  }
}
