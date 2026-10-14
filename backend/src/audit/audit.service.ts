import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface AuditEntry {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: Record<string, unknown> | null;
  ip?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  /**
   * Registra una acción. Si se pasa un EntityManager, el registro entra en la
   * misma transacción que el cambio auditado.
   */
  async record(entry: AuditEntry, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(AuditLog) : this.repo;
    try {
      await repo.insert({
        actorId: entry.actorId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        detail: (entry.detail ?? null) as never,
        ip: entry.ip ?? null,
      });
    } catch (error) {
      if (manager) throw error;
      this.logger.error(`No se pudo registrar auditoría ${entry.action}`, error as Error);
    }
  }
}
