import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HasUnsavedChanges } from '../../../core/guards/guards';
import { FarmInput, Species } from '../../../core/models/predios';
import { FarmsApiService } from '../../../core/services/farms-api.service';
import { errorMessage } from '../../../core/utils/http-error';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { ToastService } from '../../../shared/services/toast.service';
import { FarmForm } from '../farm-form/farm-form';

/** Registro de un predio nuevo. */
@Component({
  selector: 'app-farm-create',
  imports: [PageHeader, FarmForm],
  templateUrl: './farm-create.html',
})
export class FarmCreate implements OnInit, HasUnsavedChanges {
  private readonly api = inject(FarmsApiService);
  private readonly toast = inject(ToastService);
  protected readonly router = inject(Router);
  private readonly form = viewChild(FarmForm);
  private guardado = false;

  protected readonly species = signal<Species[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.api.species().subscribe({ next: (s) => this.species.set(s), error: (e) => this.error.set(errorMessage(e)) });
  }

  hasUnsavedChanges(): boolean {
    return !this.guardado && !!this.form()?.isDirty();
  }

  protected guardar(input: FarmInput) {
    this.saving.set(true);
    this.error.set(null);
    this.api.createFarm(input).subscribe({
      next: (farm) => {
        this.guardado = true;
        this.toast.success(`Predio ${farm.name} registrado.`);
        this.router.navigate(['/predios', farm.id]);
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(errorMessage(e));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }
}
