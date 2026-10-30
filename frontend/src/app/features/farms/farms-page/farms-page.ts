import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, startWith, switchMap } from 'rxjs';
import { P } from '../../../core/models/models';
import { FarmItem } from '../../../core/models/predios';
import { AuthService } from '../../../core/services/auth.service';
import { FarmsApiService } from '../../../core/services/farms-api.service';
import { errorMessage } from '../../../core/utils/http-error';
import { Nivel } from '../../../shared/components/nivel/nivel';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { Foto } from '../../../shared/components/foto/foto';

/** Lista de predios; el propietario ve solo los suyos. */
@Component({
  selector: 'app-farms-page',
  imports: [Foto, ReactiveFormsModule, RouterLink, DatePipe, PageHeader, Nivel],
  templateUrl: './farms-page.html',
  styleUrl: './farms-page.scss',
})
export class FarmsPage implements OnInit {
  private readonly api = inject(FarmsApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);
  protected readonly canManage = this.auth.can(P.FINCAS_GESTIONAR);
  protected readonly ownerOnly = !this.auth.can(P.FINCAS_VER, P.FINCAS_GESTIONAR);

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly farms = signal<FarmItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly empty = computed(() => !this.loading() && !this.error() && !this.farms().length);

  ngOnInit() {
    this.search.valueChanges
      .pipe(
        startWith(''),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          this.loading.set(true);
          this.error.set(null);
          return this.api.listFarms(term.trim()).pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (list) => this.farms.set(list), error: (e) => this.error.set(errorMessage(e, 'No se pudo cargar la lista de predios.')) });
  }

  /** "120 bovinos y 12 búfalos". */
  protected especies(f: FarmItem): string {
    const partes = f.species.map((s) => `${s.total} ${s.name.toLowerCase()}`);
    return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}` : (partes[0] ?? '');
  }
}
