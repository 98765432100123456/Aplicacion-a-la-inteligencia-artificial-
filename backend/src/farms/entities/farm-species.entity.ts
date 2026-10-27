import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Farm } from './farm.entity';
import { Species } from './species.entity';

/** Especie presente en el predio con su inventario por grupo etario (RF07, RF08). */
@Entity({ name: 'farm_species' })
@Unique(['farm', 'speciesId'])
export class FarmSpecies {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, (f) => f.species, { nullable: false, onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @ManyToOne(() => Species, { eager: true, nullable: false })
  @JoinColumn({ name: 'species_id' })
  species: Species;

  @Column({ name: 'species_id', type: 'uuid' })
  speciesId: string;

  @Column({ default: 0 })
  calves: number;

  @Column({ default: 0 })
  young: number;

  @Column({ default: 0 })
  adults: number;
}
