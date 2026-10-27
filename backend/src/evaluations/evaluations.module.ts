import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { FarmsModule } from '../farms/farms.module';
import { EvaluationAnswer } from './entities/evaluation-answer.entity';
import { Evaluation } from './entities/evaluation.entity';
import { Recommendation } from './entities/recommendation.entity';
import { Report } from './entities/report.entity';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { PdfService } from './pdf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluation, EvaluationAnswer, Recommendation, Report]), FarmsModule, AiModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService, PdfService],
})
export class EvaluationsModule {}
