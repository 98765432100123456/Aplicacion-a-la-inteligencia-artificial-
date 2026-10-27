import { Component, inject, input, OnInit, output } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FarmInput, FarmItem, Species } from '../../../core/models/predios';
import { muestraMinima, NOMBRE_PRODUCTOR, repartir, tipoProductor } from '../../../compartido/norma';
import { enfocarPrimerError, mostrarError } from '../../../shared/utils/formularios';
import { DEPARTAMENTOS } from '../data/departamentos';

const telefono = /^\+?[0-9 ]{7,20}$/;
const entero = [Validators.required, Validators.min(0), Validators.max(1_000_000), Validators.pattern(/^\d+$/)];
const vacioANulo = (v: string) => v.trim() || null;
const numeroONulo = (v: string | number | null) => (v === '' || v === null ? null : Number(v));

/** Formulario de predio: datos del propietario, ubicación y especies con su inventario (RF05 a RF08). */
@Component({
  selector: 'app-farm-form',
  imports: [ReactiveFormsModule],
  templateUrl: './farm-form.html',
  styleUrl: './farm-form.scss',
})
export class FarmForm implements OnInit {
  readonly farm = input<FarmItem | null>(null);
  readonly species = input<Species[]>([]);
  readonly saving = input(false);
  readonly serverError = input<string | null>(null);
  readonly submitLabel = input('Guardar predio');
  readonly save = output<FarmInput>();
  readonly cancel = output<void>();

  protected readonly departamentos = DEPARTAMENTOS;
  private readonly fb = inject(FormBuilder).nonNullable;
  private enviado = false;

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    ownerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    ownerPhone: ['', [Validators.required, Validators.pattern(telefono)]],
    ownerEmail: ['', [Validators.email, Validators.maxLength(160)]],
    ownerDocument: ['', Validators.pattern(/^[0-9A-Za-z-]{4,20}$/)],
    department: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    municipality: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    vereda: ['', Validators.maxLength(120)],
    address: ['', Validators.maxLength(200)],
    latitude: ['', [Validators.min(-90), Validators.max(90)]],
    longitude: ['', [Validators.min(-180), Validators.max(180)]],
    areaHectares: ['', Validators.min(0.01)],
    productionSystem: ['', Validators.maxLength(80)],
    notes: ['', Validators.maxLength(2000)],
    species: this.fb.array<ReturnType<FarmForm['filaEspecie']>>([]),
  });

  protected get filas(): FormArray<ReturnType<FarmForm['filaEspecie']>> {
    return this.form.controls.species;
  }

  ngOnInit() {
    const f = this.farm();
    if (!f) {
      this.agregarEspecie();
      return;
    }
    this.form.patchValue({
      name: f.name,
      ownerName: f.owner.name,
      ownerPhone: f.owner.phone,
      ownerEmail: f.owner.email ?? '',
      ownerDocument: f.owner.document ?? '',
      department: f.department,
      municipality: f.municipality,
      vereda: f.vereda ?? '',
      address: f.address ?? '',
      latitude: f.latitude?.toString() ?? '',
      longitude: f.longitude?.toString() ?? '',
      areaHectares: f.areaHectares?.toString() ?? '',
      productionSystem: f.productionSystem ?? '',
      notes: f.notes ?? '',
    });
    for (const s of f.species) this.filas.push(this.filaEspecie(s.speciesId, s.calves, s.young, s.adults));
  }

  isDirty(): boolean {
    return this.form.dirty;
  }

  protected filaEspecie(speciesId = '', calves = 0, young = 0, adults = 0) {
    return this.fb.group({
      speciesId: [speciesId, Validators.required],
      calves: [calves, entero],
      young: [young, entero],
      adults: [adults, entero],
    });
  }

  protected agregarEspecie() {
    const usada = new Set(this.filas.controls.map((c) => c.controls.speciesId.value));
    const libre = this.species().find((s) => !usada.has(s.id));
    this.filas.push(this.filaEspecie(libre?.id ?? ''));
    this.form.markAsDirty();
  }

  protected quitarEspecie(i: number) {
    this.filas.removeAt(i);
    this.form.markAsDirty();
  }

  /** Especies que se pueden elegir en una fila: las no usadas en otras filas. */
  protected opciones(i: number): Species[] {
    const usadas = new Set(this.filas.controls.filter((_, j) => j !== i).map((c) => c.controls.speciesId.value));
    return this.species().filter((s) => !usadas.has(s.id));
  }

  /** Resumen de la norma para la fila: total, tipo de productor y muestra mínima por grupo. */
  protected resumen(i: number) {
    const v = this.filas.at(i).getRawValue();
    const grupos = [Number(v.calves) || 0, Number(v.young) || 0, Number(v.adults) || 0];
    const total = grupos.reduce((a, b) => a + b, 0);
    const muestra = muestraMinima(total);
    return { total, productor: NOMBRE_PRODUCTOR[tipoProductor(total)], muestra, reparto: muestra ? repartir(muestra, grupos) : null };
  }

  protected bad(campo: keyof typeof this.form.controls): boolean {
    return mostrarError(this.form.controls[campo], this.enviado);
  }

  protected badFila(i: number, campo: 'speciesId' | 'calves' | 'young' | 'adults'): boolean {
    return mostrarError(this.filas.at(i).controls[campo], this.enviado);
  }

  protected submit() {
    this.enviado = true;
    if (this.form.invalid || !this.filas.length) {
      enfocarPrimerError(this.form);
      return;
    }
    const v = this.form.getRawValue();
    this.save.emit({
      name: v.name.trim(),
      ownerName: v.ownerName.trim(),
      ownerPhone: v.ownerPhone.trim(),
      ownerEmail: vacioANulo(v.ownerEmail)?.toLowerCase() ?? null,
      ownerDocument: vacioANulo(v.ownerDocument),
      department: v.department.trim(),
      municipality: v.municipality.trim(),
      vereda: vacioANulo(v.vereda),
      address: vacioANulo(v.address),
      latitude: numeroONulo(v.latitude),
      longitude: numeroONulo(v.longitude),
      areaHectares: numeroONulo(v.areaHectares),
      productionSystem: vacioANulo(v.productionSystem),
      notes: vacioANulo(v.notes),
      species: v.species.map((s) => ({ speciesId: s.speciesId, calves: Number(s.calves), young: Number(s.young), adults: Number(s.adults) })),
    });
  }
}
