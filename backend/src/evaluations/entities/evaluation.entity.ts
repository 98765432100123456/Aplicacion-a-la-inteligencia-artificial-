import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Resultado } from '../../compartido/calificacion';
import { Farm } from '../../farms/entities/farm.entity';
import { Species } from '../../farms/entities/species.entity';
import { User } from '../../users/entities/user.entity';
import { EvaluationAnswer } from './evaluation-answer.entity';

export type EvaluationStatus = 'BORRADOR' | 'FINALIZADA';

/**
 * Evaluación de una especie en un predio (RF13 a RF21). Conserva una copia del
 * inventario y del tamaño de productor del momento, para que el historial no cambie
 * si después se edita el predio.
 */
@Entity({ name: 'evaluations' })
@Index(['farmId', 'createdAt'])
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Farm, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ name: 'farm_id', type: 'uuid' })
  farmId: string;

  @ManyToOne(() => Species, { nullable: false, eager: true })
  @JoinColumn({ name: 'species_id' })
  species: Species;

  @Column({ name: 'species_id', type: 'uuid' })
  speciesId: string;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'evaluator_id' })
  evaluator: User;

  @Column({ name: 'evaluator_id', type: 'uuid' })
  evaluatorId: string;

  @Column({ length: 12, default: 'BORRADOR' })
  status: EvaluationStatus;

  @Column({ name: 'checklist_version', length: 20 })
  checklistVersion: string;

  @Column({ name: 'visit_date', type: 'date' })
  visitDate: string;

  @Column()
  calves: number;

  @Column()
  young: number;

  @Column()
  adults: number;

  @Column({ name: 'producer_type', length: 10 })
  producerType: string;

  @Column({ name: 'sample_size', type: 'int', nullable: true })
  sampleSize: number | null;

  @Column({ name: 'general_observation', type: 'text', nullable: true })
  generalObservation: string | null;

  /** Calificación de 0 a 5; se calcula al finalizar. */
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  score: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  level: string | null;

  /** Resultado completo por libertad y hallazgos, tal como se calculó al finalizar. */
  @Column({ type: 'json', nullable: true })
  results: Resultado | null;

  @OneToMany(() => EvaluationAnswer, (a) => a.evaluation, { cascade: true })
  answers: EvaluationAnswer[];

  /** Último guardado parcial (RF16). */
  @Column({ name: 'last_saved_at', type: 'datetime', precision: 3 })
  lastSavedAt: Date;

  @Column({ name: 'finished_at', type: 'datetime', precision: 3, nullable: true })
  finishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt: Date;
}
