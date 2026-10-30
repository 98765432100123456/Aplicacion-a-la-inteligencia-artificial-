import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type NombreFoto = 'potrero' | 'bebedero' | 'veterinaria' | 'sombra' | 'cria';

/** Fotografías del campo en public/fotos, con su descripción para lectores de pantalla. */
const FOTOS: Record<NombreFoto, { alto: number; descripcion: string }> = {
  potrero: { alto: 540, descripcion: 'Ganado pastando en un potrero con árboles de sombra y montañas al fondo' },
  bebedero: { alto: 718, descripcion: 'Vacas bebiendo agua limpia en un bebedero de concreto' },
  veterinaria: { alto: 718, descripcion: 'Una veterinaria revisa a una vaca en el corral' },
  sombra: { alto: 718, descripcion: 'Vacas descansando a la sombra de un árbol' },
  cria: { alto: 718, descripcion: 'Una vaca junto a su cría en el potrero' },
};

/**
 * Foto del campo. Con `decorativa` se oculta a los lectores de pantalla, para
 * cuando el texto de al lado ya dice lo mismo.
 */
@Component({
  selector: 'app-foto',
  templateUrl: './foto.html',
  styleUrl: './foto.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Foto {
  readonly nombre = input.required<NombreFoto>();
  readonly decorativa = input(false);
  readonly prioridad = input(false);
  protected readonly datos = computed(() => FOTOS[this.nombre()]);
}
