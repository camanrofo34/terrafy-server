import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Sensor, GrowingSystem, IoTDevice, SystemVariable, AgronomicVariable, AlertDefinition } from '../../domain/entities';
import { Status } from '../../domain/enums/status.enum';
import { DeviceType } from '../../domain/enums/device-type.enum';
import { RegisterSensorRequest, CreateSensorRequest } from '../model/dto/request/SensorRequest.types';
import { UpdateSensorRequest } from '../model/dto/request/UpdateSensorRequest.types';
import { PublicSensor, SensorDetailResponse } from '../model/public/PublicSensor.types';

@Injectable()
export class SensorService {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @InjectRepository(IoTDevice)
    private readonly deviceRepository: Repository<IoTDevice>,
    @InjectRepository(GrowingSystem)
    private readonly systemRepository: Repository<GrowingSystem>,
    @InjectRepository(AgronomicVariable)
    private readonly variableRepository: Repository<AgronomicVariable>,
    @InjectRepository(SystemVariable)
    private readonly systemVariableRepository: Repository<SystemVariable>,
    @InjectRepository(AlertDefinition)
    private readonly alertDefinitionRepository: Repository<AlertDefinition>,
  ) {}

  async registerSensor(payload: RegisterSensorRequest): Promise<PublicSensor> {
    // Validate system exists
    const system = await this.systemRepository.findOne({
      where: { systemId: payload.systemId },
    });

    if (!system) {
      throw new NotFoundException(`Growing system ${payload.systemId} not found`);
    }

    const normalizedVariableName = payload.type.trim();
    if (!normalizedVariableName) {
      throw new BadRequestException('Sensor type cannot be empty');
    }

    // Find or create agronomic variable
    let variable = await this.variableRepository.findOne({
      where: { name: normalizedVariableName },
    });

    if (!variable) {
      variable = await this.variableRepository.save(
        this.variableRepository.create({
          name: normalizedVariableName,
          measurementUnit: payload.unit,
          description: `${normalizedVariableName} measured by sensors`,
        }),
      );
    }

    // Find or create device (auto-hub)
    let device = await this.deviceRepository.findOne({
      where: { systemId: payload.systemId, deviceType: DeviceType.SENSOR_HUB },
      order: { deviceId: 'ASC' },
    });

    if (!device) {
      device = await this.deviceRepository.save(
        this.deviceRepository.create({
          systemId: payload.systemId,
          name: `AutoHub-${payload.systemId}`,
          logicId: `auto-hub-${payload.systemId}`,
          deviceType: DeviceType.SENSOR_HUB,
          status: Status.ACTIVE,
        }),
      );
    }

    // Create system-variable association if not exists
    const existingSystemVariable = await this.systemVariableRepository.findOne({
      where: {
        systemId: payload.systemId,
        variableId: variable.variableId,
      },
    });

    if (!existingSystemVariable) {
      await this.systemVariableRepository.save(
        this.systemVariableRepository.create({
          systemId: payload.systemId,
          variableId: variable.variableId,
          sampleRate: payload.sampleRate ?? 60,
        }),
      );
    }

    // Create sensor
    const sensor = this.sensorRepository.create({
  device: { deviceId: device.deviceId },
  variable: { variableId: variable.variableId },
  sensorType: payload.type, // 👈 ESTE ES EL CORRECTO
  status: Status.ACTIVE,
});

    const savedSensor = await this.sensorRepository.save(sensor);
    return this.toPublicSensor(savedSensor);
  }

  async createSensor(payload: CreateSensorRequest): Promise<PublicSensor> {
    // Validate device exists
    const device = await this.deviceRepository.findOne({
      where: { deviceId: payload.deviceId },
    });

    if (!device) {
      throw new NotFoundException(`IoT Device ${payload.deviceId} not found`);
    }

    // Validate variable exists
    const variable = await this.variableRepository.findOne({
      where: { variableId: payload.variableId },
    });

    if (!variable) {
      throw new NotFoundException(`Agronomic variable ${payload.variableId} not found`);
    }

    const sensor = this.sensorRepository.create({
  device: { deviceId: payload.deviceId },
  variable: { variableId: payload.variableId },
  sensorType: payload.sensorType,
  status: Status.ACTIVE,
});

    const savedSensor = await this.sensorRepository.save(sensor);
    return this.toPublicSensor(savedSensor);
  }

  async getSensorById(sensorId: number): Promise<SensorDetailResponse> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId },
      relations: ['device', 'variable', 'alertDefinition'],
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    return this.toDetailResponse(sensor);
  }

  async getSensorsBySystem(
    systemId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ sensors: SensorDetailResponse[]; total: number; page: number; lastPage: number }> {
    const [sensors, total] = await this.sensorRepository
      .createQueryBuilder('sensor')
      .leftJoinAndSelect('sensor.device', 'device')
      .leftJoinAndSelect('device.system', 'system')
      .leftJoinAndSelect('sensor.variable', 'variable')
      .leftJoinAndSelect('sensor.alertDefinition', 'alertDefinition')
      .where('device.system_id = :systemId', { systemId })
      .andWhere('sensor.status = :status', { status: Status.ACTIVE })
      .orderBy('sensor.sensorId', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      sensors: sensors.map((s) => this.toDetailResponse(s)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getSensorsByDevice(
    deviceId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ sensors: PublicSensor[]; total: number; page: number; lastPage: number }> {
    const [sensors, total] = await this.sensorRepository.findAndCount({
      where: { deviceId, status: Status.ACTIVE },
      skip: (page - 1) * limit,
      take: limit,
      order: { creationDate: 'DESC' },
    });

    return {
      sensors: sensors.map((s) => this.toPublicSensor(s)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getSensorsByVariable(
    variableId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ sensors: PublicSensor[]; total: number; page: number; lastPage: number }> {
    const [sensors, total] = await this.sensorRepository.findAndCount({
      where: { variableId, status: Status.ACTIVE },
      skip: (page - 1) * limit,
      take: limit,
      order: { creationDate: 'DESC' },
    });

    return {
      sensors: sensors.map((s) => this.toPublicSensor(s)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getAllSensors(
    page: number = 1,
    limit: number = 10,
    query?: string,
  ): Promise<{ sensors: SensorDetailResponse[]; total: number; page: number; lastPage: number }> {
    const qb = this.sensorRepository
      .createQueryBuilder('sensor')
      .leftJoinAndSelect('sensor.device', 'device')
      .leftJoinAndSelect('device.system', 'system')
      .leftJoinAndSelect('sensor.variable', 'variable')
      .leftJoinAndSelect('sensor.alertDefinition', 'alertDefinition')
      .where('sensor.status = :status', { status: Status.ACTIVE });

    if (query) {
      qb.andWhere('sensor.sensor_type LIKE :query', { query: `%${query}%` });
    }

    const [sensors, total] = await qb
      .orderBy('sensor.sensorId', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      sensors: sensors.map((s) => this.toDetailResponse(s)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async updateSensor(sensorId: number, payload: UpdateSensorRequest): Promise<PublicSensor> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    const updatedSensor = this.sensorRepository.merge(sensor, payload);
    const savedSensor = await this.sensorRepository.save(updatedSensor);

    return this.toPublicSensor(savedSensor);
  }

  async deleteSensor(sensorId: number): Promise<void> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    sensor.status = Status.INACTIVE;
    await this.sensorRepository.save(sensor);
  }

  async assignAlertDefinition(sensorId: number, alertDefinitionId: number): Promise<PublicSensor> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    const alertDefinition = await this.alertDefinitionRepository.findOne({
      where: { alertDefinitionId },
    });

    if (!alertDefinition) {
      throw new NotFoundException(`Alert definition ${alertDefinitionId} not found`);
    }

    sensor.alertDefinitionId = alertDefinitionId;
    const savedSensor = await this.sensorRepository.save(sensor);

    return this.toPublicSensor(savedSensor);
  }

  async removeAlertDefinition(sensorId: number): Promise<PublicSensor> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    sensor.alertDefinitionId = undefined;
    const savedSensor = await this.sensorRepository.save(sensor);

    return this.toPublicSensor(savedSensor);
  }

  private toPublicSensor(sensor: Sensor): PublicSensor {
    return {
      sensorId: sensor.sensorId,
      deviceId: sensor.deviceId,
      variableId: sensor.variableId,
      sensorType: sensor.sensorType,
      status: sensor.status,
      creationDate: sensor.creationDate,
      updateDate: sensor.updateDate,
      alertDefinitionId: sensor.alertDefinitionId,
    };
  }

  private toDetailResponse(sensor: Sensor): SensorDetailResponse {
    return {
      sensorId: sensor.sensorId,
      deviceId: sensor.deviceId,
      variableId: sensor.variableId,
      sensorType: sensor.sensorType,
      status: sensor.status,
      creationDate: sensor.creationDate,
      updateDate: sensor.updateDate,
      device: sensor.device
        ? {
            deviceId: sensor.device.deviceId,
            name: sensor.device.name,
          }
        : undefined,
      variable: sensor.variable
        ? {
            variableId: sensor.variable.variableId,
            name: sensor.variable.name,
            measurementUnit: sensor.variable.measurementUnit,
          }
        : undefined,
      alertDefinition: sensor.alertDefinition
        ? {
            alertDefinitionId: sensor.alertDefinition.alertDefinitionId,
            minValue: sensor.alertDefinition.minValue,
            maxValue: sensor.alertDefinition.maxValue,
          }
        : undefined,
    };
  }
}
