import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from '../common/decorators/public.decorator';

/** Usado por docker compose y por las pruebas de despliegue para saber si la API y la base responden. */
@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @SkipThrottle()
  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up', time: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
  }
}
