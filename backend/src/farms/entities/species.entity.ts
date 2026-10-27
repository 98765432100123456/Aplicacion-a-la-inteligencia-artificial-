import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Catálogo de especies; cada una tiene su lista de chequeo (compartido/lista-chequeo.ts). */
@Entity({ name: 'species' })
export class Species {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Código estable que enlaza la especie con su lista de chequeo, p. ej. BOVINO. */
  @Column({ length: 30, unique: true })
  code: string;

  @Column({ length: 80 })
  name: string;

  /** Una especie inactiva no admite evaluaciones nuevas (RF38 multiespecie). */
  @Column({ default: true })
  active: boolean;
}
