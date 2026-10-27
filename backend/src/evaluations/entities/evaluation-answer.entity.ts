import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Evaluation } from './evaluation.entity';

/** Respuesta a un indicador. Guarda el texto del criterio aplicado, para que el historial sea fiel. */
@Entity({ name: 'evaluation_answers' })
@Unique(['evaluation', 'indicatorCode'])
export class EvaluationAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Evaluation, (e) => e.answers, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: Evaluation;

  @Column({ name: 'indicator_code', length: 10 })
  indicatorCode: string;

  @Column({ name: 'indicator_text', length: 300 })
  indicatorText: string;

  @Column({ length: 20 })
  freedom: string;

  /** CUMPLE, PARCIAL, NO_CUMPLE o NO_APLICA. */
  @Column({ length: 12 })
  answer: string;

  @Column({ type: 'text', nullable: true })
  observation: string | null;
}
