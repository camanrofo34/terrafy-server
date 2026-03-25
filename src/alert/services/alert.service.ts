import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import {
  Alert,
  AlertDefinition,
  SystemVariable,
  AgronomicVariable,
  Sensor,
  GrowingSystem,
} from '../../domain/entities';
import { Status } from '../../domain/enums/status.enum';
import {
  CreateAlertDefinitionRequest,
  UpdateAlertDefinitionRequest,
} from '../model/dto/request/AlertDefinitionRequest.types';
import {
  PublicAlert,
  AlertDetailResponse,
  PublicAlertDefinition,
  AlertDefinitionDetailResponse,
  AlertEventDto,
} from '../model/public/PublicAlert.types';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(AlertDefinition)
    private readonly alertDefinitionRepository: Repository<AlertDefinition>,
    @InjectRepository(SystemVariable)
    private readonly systemVariableRepository: Repository<SystemVariable>,
    @InjectRepository(AgronomicVariable)
    private readonly variableRepository: Repository<AgronomicVariable>,
    @InjectRepository(GrowingSystem)
    private readonly systemRepository: Repository<GrowingSystem>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
  ) {}

  async createAlertDefinition(payload: CreateAlertDefinitionRequest): Promise<AlertDefinitionDetailResponse> {
    if (payload.minValue > payload.maxValue) {
      throw new BadRequestException('minValue cannot be greater than maxValue');
    }

    // Validate variable exists
    const variable = await this.variableRepository.findOne({
      where: { name: payload.variable },
    });

    if (!variable) {
      throw new NotFoundException(`Variable ${payload.variable} not found`);
    }

    // Validate system exists
    const system = await this.systemRepository.findOne({
      where: { systemId: payload.systemId },
    });

    if (!system) {
      throw new NotFoundException(`Growing system ${payload.systemId} not found`);
    }

    // Find or create system-variable association
    let systemVariable = await this.systemVariableRepository.findOne({
      where: {
        systemId: payload.systemId,
        variableId: variable.variableId,
      },
    });

    if (!systemVariable) {
      systemVariable = await this.systemVariableRepository.save(
        this.systemVariableRepository.create({
          systemId: payload.systemId,
          variableId: variable.variableId,
          sampleRate: 60,
        }),
      );
    }

    // Find or create alert definition
    let alertDefinition = await this.alertDefinitionRepository.findOne({
      where: { systemVariableId: systemVariable.systemVariableId },
    });

    if (!alertDefinition) {
      alertDefinition = this.alertDefinitionRepository.create({
        systemVariableId: systemVariable.systemVariableId,
      });
    }

    alertDefinition.minValue = payload.minValue;
    alertDefinition.maxValue = payload.maxValue;

    const savedDefinition = await this.alertDefinitionRepository.save(alertDefinition);

    // Associate with sensors
    const sensors = await this.sensorRepository
      .createQueryBuilder('sensor')
      .innerJoin('sensor.device', 'device')
      .where('device.system_id = :systemId', { systemId: payload.systemId })
      .andWhere('sensor.variable_id = :variableId', { variableId: variable.variableId })
      .getMany();

    if (sensors.length > 0) {
      const withDefinition = sensors.map((sensor) => ({
        ...sensor,
        alertDefinitionId: savedDefinition.alertDefinitionId,
      }));
      await this.sensorRepository.save(withDefinition);
    }

    return this.toAlertDefinitionDetailResponse(savedDefinition, systemVariable, variable);
  }

  async getAlertDefinitionById(alertDefinitionId: number): Promise<AlertDefinitionDetailResponse> {
    const definition = await this.alertDefinitionRepository.findOne({
      where: { alertDefinitionId },
      relations: ['systemVariable', 'systemVariable.variable'],
    });

    if (!definition) {
      throw new NotFoundException(`Alert definition ${alertDefinitionId} not found`);
    }

    return this.toAlertDefinitionDetailResponse(definition, definition.systemVariable, definition.systemVariable.variable);
  }

  async getAllAlertDefinitions(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ definitions: AlertDefinitionDetailResponse[]; total: number; page: number; lastPage: number }> {
    const [definitions, total] = await this.alertDefinitionRepository.findAndCount({
      relations: ['systemVariable', 'systemVariable.variable'],
      skip: (page - 1) * limit,
      take: limit,
      order: { alertDefinitionId: 'DESC' },
    });

    return {
      definitions: definitions.map((d) =>
        this.toAlertDefinitionDetailResponse(d, d.systemVariable, d.systemVariable.variable),
      ),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getAlertDefinitionsBySystem(
    systemId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ definitions: AlertDefinitionDetailResponse[]; total: number; page: number; lastPage: number }> {
    // Validate system exists
    const system = await this.systemRepository.findOne({
      where: { systemId },
    });

    if (!system) {
      throw new NotFoundException(`Growing system ${systemId} not found`);
    }

    const [definitions, total] = await this.alertDefinitionRepository
      .createQueryBuilder('alertDefinition')
      .leftJoinAndSelect('alertDefinition.systemVariable', 'systemVariable')
      .leftJoinAndSelect('systemVariable.variable', 'variable')
      .where('systemVariable.system_id = :systemId', { systemId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('alertDefinition.alert_definition_id', 'DESC')
      .getManyAndCount();

    return {
      definitions: definitions.map((d) =>
        this.toAlertDefinitionDetailResponse(d, d.systemVariable, d.systemVariable.variable),
      ),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async updateAlertDefinition(
    alertDefinitionId: number,
    payload: UpdateAlertDefinitionRequest,
  ): Promise<AlertDefinitionDetailResponse> {
    const definition = await this.alertDefinitionRepository.findOne({
      where: { alertDefinitionId },
      relations: ['systemVariable', 'systemVariable.variable'],
    });

    if (!definition) {
      throw new NotFoundException(`Alert definition ${alertDefinitionId} not found`);
    }

    if (payload.minValue !== undefined && payload.maxValue !== undefined) {
      if (payload.minValue > payload.maxValue) {
        throw new BadRequestException('minValue cannot be greater than maxValue');
      }
    }

    const updatedDefinition = this.alertDefinitionRepository.merge(definition, payload);
    const savedDefinition = await this.alertDefinitionRepository.save(updatedDefinition);

    return this.toAlertDefinitionDetailResponse(
      savedDefinition,
      savedDefinition.systemVariable,
      savedDefinition.systemVariable.variable,
    );
  }

  async deleteAlertDefinition(alertDefinitionId: number): Promise<void> {
    const definition = await this.alertDefinitionRepository.findOne({
      where: { alertDefinitionId },
    });

    if (!definition) {
      throw new NotFoundException(`Alert definition ${alertDefinitionId} not found`);
    }

    // Remove alert definition from sensors
    await this.sensorRepository.update({ alertDefinitionId }, { alertDefinitionId: undefined });

    // Delete the alert definition
    await this.alertDefinitionRepository.remove(definition);
  }

  async getAlerts(
    page: number = 1,
    limit: number = 500,
    status?: Status,
  ): Promise<{ alerts: AlertDetailResponse[]; total: number; page: number; lastPage: number }> {
    const [alerts, total] = await this.alertRepository.findAndCount({
      where: status ? { status } : {},
      relations: ['sensor', 'sensor.variable'],
      skip: (page - 1) * limit,
      take: limit,
      order: { creationDate: 'DESC' },
    });

    return {
      alerts: alerts.map((a) => this.toAlertDetailResponse(a)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getAlertEvents(
    systemId?: number,
    page: number = 1,
    limit: number = 200,
  ): Promise<{ events: AlertEventDto[]; total: number; page: number; lastPage: number }> {
    const qb = this.alertRepository
      .createQueryBuilder('alert')
      .innerJoin('alert.sensor', 'sensor')
      .innerJoin('sensor.variable', 'variable')
      .innerJoin('sensor.device', 'device')
      .select('alert.alert_id', 'alertId')
      .addSelect('alert.sensor_id', 'sensorId')
      .addSelect('variable.name', 'variableName')
      .addSelect('alert.detected_value', 'detectedValue')
      .addSelect('alert.alert_type', 'alertType')
      .addSelect('alert.creation_date', 'creationDate');

    if (systemId) {
      qb.where('device.system_id = :systemId', { systemId });
    }

    const [raw, total] = await qb
      .orderBy('alert.creation_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const events = raw.map((row: any) => ({
      alertId: Number(row.alertId),
      sensorId: Number(row.sensorId),
      variableName: row.variableName as string,
      detectedValue: Number(row.detectedValue),
      alertType: row.alertType,
      creationDate: row.creationDate,
    }));

    return {
      events,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getAlertsBySensor(
    sensorId: number,
    page: number = 1,
    limit: number = 100,
  ): Promise<{ alerts: AlertDetailResponse[]; total: number; page: number; lastPage: number }> {
    const [alerts, total] = await this.alertRepository.findAndCount({
      where: { sensorId },
      relations: ['sensor', 'sensor.variable'],
      skip: (page - 1) * limit,
      take: limit,
      order: { creationDate: 'DESC' },
    });

    return {
      alerts: alerts.map((a) => this.toAlertDetailResponse(a)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async resolveAlert(alertId: number): Promise<PublicAlert> {
    const alert = await this.alertRepository.findOne({
      where: { alertId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    alert.status = Status.INACTIVE;
    const savedAlert = await this.alertRepository.save(alert);

    return this.toPublicAlert(savedAlert);
  }

  async deleteAlert(alertId: number): Promise<void> {
    const alert = await this.alertRepository.findOne({
      where: { alertId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    await this.alertRepository.remove(alert);
  }

  async deleteOldAlerts(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.alertRepository.delete({
      creationDate: LessThanOrEqual(cutoffDate),
    });

    return result.affected || 0;
  }

  private toPublicAlert(alert: Alert): PublicAlert {
    return {
      alertId: alert.alertId,
      sensorId: alert.sensorId,
      detectedValue: alert.detectedValue,
      alertType: alert.alertType,
      status: alert.status,
      creationDate: alert.creationDate,
    };
  }

  private toAlertDetailResponse(alert: Alert): AlertDetailResponse {
    return {
      alertId: alert.alertId,
      sensorId: alert.sensorId,
      detectedValue: alert.detectedValue,
      alertType: alert.alertType,
      status: alert.status,
      creationDate: alert.creationDate,
      sensor: alert.sensor
        ? {
            sensorId: alert.sensor.sensorId,
            sensorType: alert.sensor.sensorType,
            variable: alert.sensor.variable
              ? {
                  variableId: alert.sensor.variable.variableId,
                  name: alert.sensor.variable.name,
                }
              : undefined,
          }
        : undefined,
    };
  }

  private toPublicAlertDefinition(definition: AlertDefinition): PublicAlertDefinition {
    return {
      alertDefinitionId: definition.alertDefinitionId,
      systemVariableId: definition.systemVariableId,
      minValue: definition.minValue,
      maxValue: definition.maxValue,
      creationDate: definition.creationDate,
      updateDate: definition.updateDate,
    };
  }

  private toAlertDefinitionDetailResponse(
    definition: AlertDefinition,
    systemVariable?: SystemVariable,
    variable?: AgronomicVariable,
  ): AlertDefinitionDetailResponse {
    return {
      alertDefinitionId: definition.alertDefinitionId,
      systemVariableId: definition.systemVariableId,
      minValue: definition.minValue,
      maxValue: definition.maxValue,
      creationDate: definition.creationDate,
      updateDate: definition.updateDate,
      systemVariable: systemVariable
        ? {
            systemVariableId: systemVariable.systemVariableId,
            systemId: systemVariable.systemId,
            variableId: systemVariable.variableId,
            sampleRate: systemVariable.sampleRate,
            variable: variable
              ? {
                  variableId: variable.variableId,
                  name: variable.name,
                  measurementUnit: variable.measurementUnit,
                }
              : undefined,
          }
        : undefined,
    };
  }
}
