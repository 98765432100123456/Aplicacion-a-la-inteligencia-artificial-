import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FarmSpecies } from './farm-species.entity';

/** Predio o finca con los datos de su propietario y su ubicación (RF05, RF06). */
@Entity({ name: 'farms' })
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 120 })
  name: string;

  @Column({ name: 'owner_name', length: 160 })
  ownerName: string;

  @Column({ name: 'owner_document', type: 'varchar', length: 20, nullable: true })
  ownerDocument: string | null;

  @Column({ name: 'owner_phone', length: 20 })
  ownerPhone: string;

  /** Con este correo el propietario ve el predio al ingresar, aunque aún no tenga cuenta. */
  @Index()
  @Column({ name: 'owner_email', type: 'varchar', length: 160, nullable: true })
  ownerEmail: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser: User | null;

  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId: string | null;

  @Column({ length: 80 })
  department: string;

  @Column({ length: 80 })
  municipality: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  vereda: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude: string | null;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude: string | null;

  @Column({ name: 'area_hectares', type: 'decimal', precision: 10, scale: 2, nullable: true })
  areaHectares: string | null;

  @Column({ name: 'production_system', type: 'varchar', length: 80, nullable: true })
  productionSystem: string | null;

  /** Información adicional útil para la evaluación: accesos, instalaciones, manejo. */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => FarmSpecies, (s) => s.farm, { cascade: true, eager: true })
  species: FarmSpecies[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt: Date;
}
