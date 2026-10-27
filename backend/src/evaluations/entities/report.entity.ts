import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Evaluation } from './evaluation.entity';

export type ReportKind = 'TECNICO' | 'PROPIETARIO';

/** Informe PDF guardado en la base de datos junto con su evaluación (RF31). */
@Entity({ name: 'reports' })
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Evaluation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: Evaluation;

  @Column({ name: 'evaluation_id', type: 'uuid' })
  evaluationId: string;

  @Column({ length: 12 })
  kind: ReportKind;

  @Column({ name: 'file_name', length: 160 })
  fileName: string;

  @Column({ name: 'size_bytes' })
  sizeBytes: number;

  /** Contenido del PDF; no se carga al listar el historial. */
  @Column({ type: 'longblob', select: false })
  content: Buffer;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt: Date;
}
