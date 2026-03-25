import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { SensorReading, Sensor, Alert, AlertDefinition } from '../../domain/entities';
import { AlertType } from '../../domain/enums/alert-type.enum';
import { Status } from '../../domain/enums/status.enum';
import { CreateMeasurementRequest, CreateBatchMeasurementRequest } from '../model/dto/request/CreateMeasurementRequest.types';
import { PublicSensorReading, SensorReadingDetailResponse, StatisticDto } from '../model/public/PublicSensorReading.types';

@Injectable()
export class SensorReadingService {
  constructor(
    @InjectRepository(SensorReading)
    private readonly readingRepository: Repository<SensorReading>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(AlertDefinition)
    private readonly alertDefinitionRepository: Repository<AlertDefinition>,
  ) {}

  async createMeasurement(payload: CreateMeasurementRequest): Promise<SensorReadingDetailResponse> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId: payload.sensorId },
      relations: ['variable', 'alertDefinition'],
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${payload.sensorId} not found`);
    }

    const reading = this.readingRepository.create({
      sensorId: payload.sensorId,
      value: payload.value,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    });

    const savedReading = await this.readingRepository.save(reading);

    // Check for alerts
    if (sensor.alertDefinition) {
      const { minValue, maxValue } = sensor.alertDefinition;
      if (savedReading.value < minValue || savedReading.value > maxValue) {
        const range = maxValue - minValue || 1;
        const overflow =
          savedReading.value < minValue ? minValue - savedReading.value : savedReading.value - maxValue;

        const alertType = overflow > range * 0.2 ? AlertType.DANGEROUS : AlertType.WARNING;

        await this.alertRepository.save(
          this.alertRepository.create({
            sensorId: sensor.sensorId,
            detectedValue: savedReading.value,
            alertType,
            status: Status.ACTIVE,
          }),
        );
      }
    }

    return this.toDetailResponse(savedReading, sensor);
  }

  async createBatchMeasurements(payload: CreateBatchMeasurementRequest): Promise<PublicSensorReading[]> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId: payload.sensorId },
      relations: ['alertDefinition'],
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${payload.sensorId} not found`);
    }

    const readings = payload.readings.map((r) =>
      this.readingRepository.create({
        sensorId: payload.sensorId,
        value: r.value,
        timestamp: new Date(r.timestamp),
      }),
    );

    const savedReadings = await this.readingRepository.save(readings);

    // Check for alerts
    if (sensor.alertDefinition) {
      const { minValue, maxValue } = sensor.alertDefinition;
      const alerts = savedReadings
        .filter((r) => r.value < minValue || r.value > maxValue)
        .map((r) => {
          const range = maxValue - minValue || 1;
          const overflow = r.value < minValue ? minValue - r.value : r.value - maxValue;
          const alertType = overflow > range * 0.2 ? AlertType.DANGEROUS : AlertType.WARNING;

          return this.alertRepository.create({
            sensorId: sensor.sensorId,
            detectedValue: r.value,
            alertType,
            status: Status.ACTIVE,
          });
        });

      if (alerts.length > 0) {
        await this.alertRepository.save(alerts);
      }
    }

    return savedReadings.map((r) => this.toPublicReading(r));
  }

  async getMeasurementsBySensor(
    sensorId: number,
    page: number = 1,
    limit: number = 500,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ readings: SensorReadingDetailResponse[]; total: number; page: number; lastPage: number }> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId },
      relations: ['variable'],
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    const whereClause: any = { sensorId };

    if (startDate && endDate) {
      whereClause.timestamp = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.timestamp = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereClause.timestamp = LessThanOrEqual(endDate);
    }

    const [readings, total] = await this.readingRepository.findAndCount({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      order: { timestamp: 'DESC' },
    });

    return {
      readings: readings.map((r) => this.toDetailResponse(r, sensor)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getRecentMeasurements(
    sensorId: number,
    limit: number = 10,
  ): Promise<SensorReadingDetailResponse[]> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId },
      relations: ['variable'],
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    const readings = await this.readingRepository.find({
      where: { sensorId },
      order: { timestamp: 'DESC' },
      take: limit,
    });

    return readings.map((r) => this.toDetailResponse(r, sensor));
  }

  async getLatestMeasurement(sensorId: number): Promise<SensorReadingDetailResponse | null> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId },
      relations: ['variable'],
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    const reading = await this.readingRepository.findOne({
      where: { sensorId },
      order: { timestamp: 'DESC' },
    });

    if (!reading) {
      return null;
    }

    return this.toDetailResponse(reading, sensor);
  }

  async getStatistics(systemId?: number): Promise<StatisticDto[]> {
    const qb = this.readingRepository
      .createQueryBuilder('reading')
      .innerJoin('reading.sensor', 'sensor')
      .innerJoin('sensor.variable', 'variable')
      .innerJoin('sensor.device', 'device')
      .select('variable.variable_id', 'variableId')
      .addSelect('variable.name', 'variableName')
      .addSelect('variable.measurement_unit', 'measurementUnit')
      .addSelect('COUNT(reading.reading_id)', 'readingsCount')
      .addSelect('AVG(reading.value)', 'avgValue')
      .addSelect('MIN(reading.value)', 'minValue')
      .addSelect('MAX(reading.value)', 'maxValue')
      .addSelect('MAX(reading.timestamp)', 'latestReadingAt')
      .groupBy('variable.variable_id')
      .addGroupBy('variable.name')
      .addGroupBy('variable.measurement_unit')
      .orderBy('variable.name', 'ASC');

    if (systemId) {
      qb.where('device.system_id = :systemId', { systemId });
    }

    const raw = await qb.getRawMany<{
      variableId: string;
      variableName: string;
      measurementUnit: string;
      readingsCount: string;
      avgValue: string;
      minValue: string;
      maxValue: string;
      latestReadingAt: Date | null;
    }>();

    return raw.map((row) => ({
      variableId: Number(row.variableId),
      variableName: row.variableName,
      measurementUnit: row.measurementUnit,
      readingsCount: Number(row.readingsCount),
      avgValue: Number(row.avgValue),
      minValue: Number(row.minValue),
      maxValue: Number(row.maxValue),
      latestReadingAt: row.latestReadingAt,
    }));
  }

  async getVariableStatistics(variableId: number): Promise<StatisticDto | null> {
    const stats = await this.getStatistics();
    return stats.find((s) => s.variableId === variableId) || null;
  }

  async deleteMeasurement(readingId: number): Promise<void> {
    const reading = await this.readingRepository.findOne({
      where: { readingId },
    });

    if (!reading) {
      throw new NotFoundException(`Reading ${readingId} not found`);
    }

    await this.readingRepository.remove(reading);
  }

  async deleteOldMeasurements(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.readingRepository.delete({
      timestamp: LessThanOrEqual(cutoffDate),
    });

    return result.affected || 0;
  }

  private toPublicReading(reading: SensorReading): PublicSensorReading {
    return {
      readingId: reading.readingId,
      sensorId: reading.sensorId,
      value: reading.value,
      timestamp: reading.timestamp,
      creationDate: reading.creationDate,
    };
  }

  private toDetailResponse(reading: SensorReading, sensor?: Sensor): SensorReadingDetailResponse {
    return {
      readingId: reading.readingId,
      sensorId: reading.sensorId,
      value: reading.value,
      timestamp: reading.timestamp,
      creationDate: reading.creationDate,
      sensor: sensor
        ? {
            sensorId: sensor.sensorId,
            sensorType: sensor.sensorType,
            variable: sensor.variable
              ? {
                  variableId: sensor.variable.variableId,
                  name: sensor.variable.name,
                  measurementUnit: sensor.variable.measurementUnit,
                }
              : undefined,
          }
        : undefined,
    };
  }
}
