import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluation } from '../evaluations/entities/evaluation.entity';
import { User } from '../users/entities/user.entity';
import { FarmSpecies } from './entities/farm-species.entity';
import { Farm } from './entities/farm.entity';
import { Species } from './entities/species.entity';
import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Farm, FarmSpecies, Species, Evaluation, User])],
  controllers: [FarmsController],
  providers: [FarmsService],
  exports: [FarmsService],
})
export class FarmsModule {}
