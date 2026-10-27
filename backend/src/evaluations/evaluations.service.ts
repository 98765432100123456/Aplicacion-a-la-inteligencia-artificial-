import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/interfaces/auth-user';
import { calificar, pendientes, RespuestaIndicador } from '../compartido/calificacion';
import { informePropietario, informeTecnico } from '../compartido/informes';
import { Respuesta, VERSION_LISTA } from '../compartido/lista-chequeo';
import { muestraMinima, NOMBRE_PRODUCTOR, tipoProductor } from '../compartido/norma';
import { recomendacionesPorReglas, Recomendaciones } from '../compartido/recomendaciones';
import { seesAllFarms } from '../farms/farm-access';
import { FarmsService } from '../farms/farms.service';
import { SaveEvaluationDto, StartEvaluationDto } from './dto/evaluation.dto';
import { EvaluationAnswer } from './entities/evaluation-answer.entity';
import { Evaluation } from './entities/evaluation.entity';
import { Recommendation } from './entities/recommendation.entity';
import { Report, ReportKind } from './entities/report.entity';
import { datosInforme, listaDe, vistaEvaluacion } from './evaluation-view';
import { PdfService } from './pdf.service';

const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation) private readonly evaluations: Repository<Evaluation>,
    @InjectRepository(Recommendation) private readonly recommendations: Repository<Recommendation>,
    @InjectRepository(Report) private readonly reports: Repository<Report>,
    private readonly farms: FarmsService,
    private readonly ai: AiService,
    private readonly pdf: PdfService,
    private readonly audit: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  /** Historial del predio, del más reciente al más antiguo (RF28). El propietario ve solo las finalizadas. */
  async history(farmId: string, user: AuthUser) {
    const farm = await this.farms.getVisible(farmId, user);
    const list = await this.evaluations.find({
      where: { farmId, ...(seesAllFarms(user) ? {} : { status: 'FINALIZADA' as const }) },
      order: { createdAt: 'DESC' },
    });
    const ids = list.map((e) => e.id);
    const recs = ids.length ? await this.recommendations.find({ where: { evaluationId: In(ids) }, order: { createdAt: 'DESC' } }) : [];
    const reps = ids.length ? await this.reports.find({ where: { evaluationId: In(ids) }, order: { createdAt: 'DESC' } }) : [];
    return list.map((e) => {
      const { checklist: _lista, answers: _respuestas, ...resumen } = vistaEvaluacion(
        { ...e, answers: [] } as Evaluation,
        farm,
        recs.find((r) => r.evaluationId === e.id) ?? null,
        this.latestReports(reps.filter((r) => r.evaluationId === e.id)),
      );
      return resumen;
    });
  }

  /** Crea una evaluación en borrador, o devuelve la que ya está en curso para esa especie (RF13, RF14). */
  async start(farmId: string, dto: StartEvaluationDto, user: AuthUser) {
    const farm = await this.farms.getVisible(farmId, user);
    const fs = farm.species.find((s) => s.speciesId === dto.speciesId);
    if (!fs) throw new BadRequestException('Esa especie no está registrada en el predio.');
    if (!fs.species.active) throw new BadRequestException('La especie está inactiva en la plataforma.');
    const draft = await this.evaluations.findOne({ where: { farmId, speciesId: dto.speciesId, status: 'BORRADOR' } });
    if (draft) return this.findOne(draft.id, user);

    const total = fs.calves + fs.young + fs.adults;
    const created = await this.evaluations.save(
      this.evaluations.create({
        farmId,
        speciesId: dto.speciesId,
        evaluatorId: user.id,
        checklistVersion: VERSION_LISTA,
        visitDate: dto.visitDate ?? hoy(),
        calves: fs.calves,
        young: fs.young,
        adults: fs.adults,
        producerType: tipoProductor(total),
        sampleSize: muestraMinima(total),
        lastSavedAt: new Date(),
      }),
    );
    await this.audit.record({ actorId: user.id, action: 'evaluation.created', entity: 'evaluation', entityId: created.id, detail: { farmId } });
    return this.findOne(created.id, user);
  }

  async findOne(id: string, user: AuthUser) {
    const { evaluation, farm } = await this.load(id, user);
    const rec = await this.recommendations.findOne({ where: { evaluationId: id }, order: { createdAt: 'DESC' } });
    const reps = await this.reports.find({ where: { evaluationId: id }, order: { createdAt: 'DESC' } });
    return vistaEvaluacion(evaluation, farm, rec, this.latestReports(reps));
  }

  /** Guardado parcial con fecha y hora (RF15, RF16, RF18). */
  async save(id: string, dto: SaveEvaluationDto, user: AuthUser) {
    const { evaluation } = await this.load(id, user);
    this.assertDraft(evaluation);
    const lista = new Map(listaDe(evaluation).map((i) => [i.codigo, i]));
    for (const a of dto.answers ?? []) {
      const indicador = lista.get(a.indicatorCode);
      if (!indicador) throw new BadRequestException(`El indicador ${a.indicatorCode} no pertenece a esta lista de chequeo.`);
      if (indicador.respuesta === 'SI_NO' && a.answer === 'PARCIAL') {
        throw new BadRequestException(`El indicador ${a.indicatorCode} solo admite cumple o no cumple.`);
      }
      const existing = evaluation.answers.find((x) => x.indicatorCode === a.indicatorCode);
      const answer = existing ?? Object.assign(new EvaluationAnswer(), {
        indicatorCode: indicador.codigo,
        indicatorText: indicador.texto,
        freedom: indicador.libertad,
      });
      answer.answer = a.answer;
      answer.observation = a.observation ?? null;
      if (!existing) evaluation.answers.push(answer);
    }
    if (dto.visitDate !== undefined) evaluation.visitDate = dto.visitDate;
    if (dto.generalObservation !== undefined) evaluation.generalObservation = dto.generalObservation;
    evaluation.lastSavedAt = new Date();
    await this.evaluations.save(evaluation);
    return this.findOne(id, user);
  }

  /**
   * Finaliza: valida que todo esté respondido (RF17), calcula el puntaje y el nivel
   * (RF20, RF21), genera las recomendaciones (RF24) y los dos informes PDF (RF31).
   */
  async finalize(id: string, user: AuthUser) {
    const { evaluation, farm } = await this.load(id, user);
    this.assertDraft(evaluation);
    const lista = listaDe(evaluation);
    const faltan = pendientes(lista, this.respuestas(evaluation));
    if (faltan.length) {
      throw new BadRequestException(
        `Faltan ${faltan.length} ${faltan.length === 1 ? 'indicador' : 'indicadores'} por responder: ${faltan.map((i) => i.codigo).join(', ')}.`,
      );
    }
    const resultado = calificar(lista, this.respuestas(evaluation));
    const rec = await this.buildRecommendations(evaluation, farm, resultado);

    evaluation.status = 'FINALIZADA';
    evaluation.score = resultado.puntaje.toFixed(2);
    evaluation.level = resultado.nivel;
    evaluation.results = resultado;
    evaluation.finishedAt = new Date();
    evaluation.lastSavedAt = evaluation.finishedAt;

    const datos = datosInforme(evaluation, farm, resultado, rec);
    const [tecnico, propietario] = await Promise.all([this.pdf.render(informeTecnico(datos)), this.pdf.render(informePropietario(datos))]);

    await this.dataSource.transaction(async (m) => {
      await m.getRepository(Evaluation).save(evaluation);
      await m.getRepository(Recommendation).save(this.recommendationEntity(evaluation.id, rec));
      await m.getRepository(Report).save([this.reportEntity(evaluation, 'TECNICO', tecnico), this.reportEntity(evaluation, 'PROPIETARIO', propietario)]);
      await this.audit.record(
        { actorId: user.id, action: 'evaluation.finalized', entity: 'evaluation', entityId: id, detail: { score: resultado.puntaje, level: resultado.nivel, recommendations: rec.origen } },
        m,
      );
    });
    return this.findOne(id, user);
  }

  /** Vuelve a generar las recomendaciones y el informe del propietario, por ejemplo si la IA no respondió. */
  async regenerate(id: string, user: AuthUser) {
    const { evaluation, farm } = await this.load(id, user);
    if (evaluation.status !== 'FINALIZADA' || !evaluation.results) throw new ConflictException('La evaluación aún no está finalizada.');
    const rec = await this.buildRecommendations(evaluation, farm, evaluation.results);
    const pdf = await this.pdf.render(informePropietario(datosInforme(evaluation, farm, evaluation.results, rec)));
    await this.recommendations.save(this.recommendationEntity(id, rec));
    await this.reports.save(this.reportEntity(evaluation, 'PROPIETARIO', pdf));
    await this.audit.record({ actorId: user.id, action: 'evaluation.recommendations_regenerated', entity: 'evaluation', entityId: id, detail: { source: rec.origen } });
    return this.findOne(id, user);
  }

  /** Informe PDF más reciente del tipo pedido. */
  async report(id: string, kind: ReportKind, user: AuthUser) {
    const { evaluation } = await this.load(id, user);
    const report = await this.reports
      .createQueryBuilder('r')
      .addSelect('r.content')
      .where('r.evaluation_id = :id AND r.kind = :kind', { id: evaluation.id, kind })
      .orderBy('r.created_at', 'DESC')
      .getOne();
    if (!report) throw new NotFoundException('Este informe aún no se ha generado.');
    return report;
  }

  private async load(id: string, user: AuthUser) {
    const evaluation = await this.evaluations.findOne({ where: { id }, relations: { answers: true } });
    if (!evaluation) throw new NotFoundException('La evaluación no existe.');
    const farm = await this.farms.getVisible(evaluation.farmId, user);
    if (!seesAllFarms(user) && evaluation.status !== 'FINALIZADA') throw new NotFoundException('La evaluación no existe.');
    return { evaluation, farm };
  }

  private assertDraft(e: Evaluation) {
    if (e.status !== 'BORRADOR') throw new ConflictException('La evaluación ya está finalizada y no se puede modificar.');
  }

  private respuestas(e: Evaluation): Record<string, RespuestaIndicador> {
    return Object.fromEntries(e.answers.map((a) => [a.indicatorCode, { respuesta: a.answer as Respuesta, observacion: a.observation }]));
  }

  private async buildRecommendations(e: Evaluation, farm: { municipality: string; department: string }, resultado: ReturnType<typeof calificar>): Promise<Recomendaciones> {
    const lista = listaDe(e);
    const ia = await this.ai.recommend({
      especie: e.species.name,
      productor: NOMBRE_PRODUCTOR[e.producerType as keyof typeof NOMBRE_PRODUCTOR] ?? e.producerType,
      municipio: `${farm.municipality}, ${farm.department}`,
      resultado,
      lista,
    });
    return ia ?? recomendacionesPorReglas(resultado, lista);
  }

  private recommendationEntity(evaluationId: string, rec: Recomendaciones) {
    return this.recommendations.create({ evaluationId, source: rec.origen, model: rec.modelo, summary: rec.resumen, items: rec.recomendaciones });
  }

  private reportEntity(e: Evaluation, kind: ReportKind, content: Buffer) {
    const nombre = kind === 'TECNICO' ? 'informe-tecnico' : 'recomendaciones-propietario';
    return this.reports.create({ evaluationId: e.id, kind, fileName: `${nombre}-${e.visitDate}-${e.id.slice(0, 8)}.pdf`, sizeBytes: content.length, content });
  }

  /** El historial muestra solo la versión más reciente de cada tipo de informe. */
  private latestReports(list: Report[]) {
    return (['TECNICO', 'PROPIETARIO'] as const).flatMap((k) => list.find((r) => r.kind === k) ?? []);
  }
}
