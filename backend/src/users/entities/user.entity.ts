import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', length: 80 })
  firstName: string;

  @Column({ name: 'last_name', length: 80 })
  lastName: string;

  /** Siempre en minúsculas; el índice único evita duplicados. */
  @Index({ unique: true })
  @Column({ length: 160 })
  email: string;

  @Column({ name: 'document_number', type: 'varchar', length: 20, nullable: true })
  documentNumber: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'password_hash', length: 100, select: false })
  passwordHash: string;

  @ManyToOne(() => Role, (role) => role.users, { nullable: false, eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ default: true })
  active: boolean;

  /** Intentos fallidos seguidos; se reinicia al ingresar bien. */
  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  /** Tokens emitidos antes de esta fecha se rechazan (cambio de clave, inactivación). */
  @Column({ name: 'password_changed_at', type: 'timestamptz', default: () => 'now()' })
  passwordChangedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
