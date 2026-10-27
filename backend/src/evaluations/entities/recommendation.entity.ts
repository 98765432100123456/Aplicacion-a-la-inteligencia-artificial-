import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Recomendacion } from '../../compartido/recomendaciones';
import { Evaluation } from './evaluation.entity';

/** Recomendaciones para el propietario, generadas con IA o por reglas (RF24 a RF27). */
@Entity({ name: 'recommendations' })
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Evaluation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: Evaluation;

  @Column({ name: 'evaluation_id', type: 'uuid' })
  evaluationId: string;

  /** IA o REGLAS. */
  @Column({ length: 10 })
  source: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  model: string | null;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'json' })
  items: Recomendacion[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt: Date;
}
