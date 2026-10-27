import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Código estable en mayúsculas, p. ej. ADMIN. No cambia después de creado. */
  @Column({ length: 40, unique: true })
  code: string;

  @Column({ length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  /** Lista de códigos de permiso guardada como JSON. */
  @Column({ type: 'simple-json' })
  permissions: string[];

  /** Los roles del sistema no se pueden inactivar ni perder permisos de seguridad. */
  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt: Date;
}
