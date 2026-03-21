// import {
//   BadRequestException,
//   ConflictException,
//   Injectable,
//   NotFoundException,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { AlertType } from '../domain/enums/alert-type.enum';
// import { DeviceType } from '../domain/enums/device-type.enum';
// import { Role } from '../domain/enums/role.enum';
// import { Status } from '../domain/enums/status.enum';
// import {
//   Alert,
//   AlertDefinition,
//   AgronomicVariable,
//   GrowingSystem,
//   IoTDevice,
//   Sensor,
//   SensorReading,
//   SystemVariable,
//   User,
// } from '../domain/entities';
// import {
//   AlertEventDto,
//   CreateAlertDefinitionDto,
//   CreateGrowingSystemDto,
//   CreateMeasurementDto,
//   CreateUserDto,
//   LoginDto,
//   LoginResponse,
//   PublicUser,
//   RegisterSensorDto,
//   StatisticDto,
// } from './api-center.types';

// @Injectable()
// export class ApiCenterService {
//   constructor(
//     @InjectRepository(User)
//     private readonly usersRepository: Repository<User>,
//     @InjectRepository(GrowingSystem)
//     private readonly systemsRepository: Repository<GrowingSystem>,
//     @InjectRepository(IoTDevice)
//     private readonly devicesRepository: Repository<IoTDevice>,
//     @InjectRepository(AgronomicVariable)
//     private readonly variablesRepository: Repository<AgronomicVariable>,
//     @InjectRepository(SystemVariable)
//     private readonly systemVariablesRepository: Repository<SystemVariable>,
//     @InjectRepository(Sensor)
//     private readonly sensorsRepository: Repository<Sensor>,
//     @InjectRepository(SensorReading)
//     private readonly sensorReadingsRepository: Repository<SensorReading>,
//     @InjectRepository(AlertDefinition)
//     private readonly alertDefinitionsRepository: Repository<AlertDefinition>,
//     @InjectRepository(Alert)
//     private readonly alertsRepository: Repository<Alert>,
//   ) {}

//   async login(payload: LoginDto): Promise<LoginResponse> {
//     const user = await this.usersRepository.findOne({
//       where: { email: payload.email },
//     });

//     if (!user || user.password !== payload.password) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     if (user.status !== Status.ACTIVE) {
//       throw new UnauthorizedException('User is inactive');
//     }

//     const raw = `${user.userId}:${user.email}:${Date.now()}`;
//     const token = Buffer.from(raw).toString('base64url');

//     return {
//       token,
//       user: this.toPublicUser(user),
//     };
//   }

//   async createUser(payload: CreateUserDto): Promise<PublicUser> {
//     const existingUser = await this.usersRepository.findOne({
//       where: { email: payload.email },
//     });

//     if (existingUser) {
//       throw new ConflictException('A user with this email already exists');
//     }

//     const user = this.usersRepository.create({
//       name: payload.name,
//       email: payload.email,
//       password: payload.password,
//       role: payload.role ?? Role.AGRARIAN,
//       status: Status.ACTIVE,
//     });

//     const saved = await this.usersRepository.save(user);
//     return this.toPublicUser(saved);
//   }

//   async getUser(userId: number): Promise<PublicUser> {
//     const user = await this.usersRepository.findOne({ where: { userId } });
//     if (!user) {
//       throw new NotFoundException(`User ${userId} not found`);
//     }

//     return this.toPublicUser(user);
//   }

//   // async createGrowingSystem(payload: CreateGrowingSystemDto): Promise<GrowingSystem> {
//   //   const user = await this.usersRepository.findOne({
//   //     where: { userId: payload.userId },
//   //   });

//   //   if (!user) {
//   //     throw new NotFoundException(`User ${payload.userId} not found`);
//   //   }

//   //   const system = this.systemsRepository.create({
//   //     userId: payload.userId,
//   //     name: payload.name,
//   //     ubication: payload.location,
//   //     description: payload.description,
//   //     status: Status.ACTIVE,
//   //   });

//   //   return this.systemsRepository.save(system);
//   // }

//   async getGrowingSystems(): Promise<GrowingSystem[]> {
//     return this.systemsRepository
//       .createQueryBuilder('system')
//       .leftJoinAndSelect('system.user', 'user')
//       .leftJoinAndSelect('system.devices', 'device')
//       .orderBy('system.systemId', 'DESC')
//       .getMany();
//   }

//   async registerSensor(payload: RegisterSensorDto): Promise<Sensor> {
//     const system = await this.systemsRepository.findOne({
//       where: { systemId: payload.systemId },
//     });

//     if (!system) {
//       throw new NotFoundException(`Growing system ${payload.systemId} not found`);
//     }

//     const normalizedVariableName = payload.type.trim();
//     if (!normalizedVariableName) {
//       throw new BadRequestException('Sensor type cannot be empty');
//     }

//     let variable = await this.variablesRepository.findOne({
//       where: { name: normalizedVariableName },
//     });

//     if (!variable) {
//       variable = await this.variablesRepository.save(
//         this.variablesRepository.create({
//           name: normalizedVariableName,
//           measurementUnit: payload.unit,
//           description: `${normalizedVariableName} measured by sensors`,
//         }),
//       );
//     }

//     let device = await this.devicesRepository.findOne({
//       where: { systemId: payload.systemId },
//       order: { deviceId: 'ASC' },
//     });

//     if (!device) {
//       device = await this.devicesRepository.save(
//         this.devicesRepository.create({
//           systemId: payload.systemId,
//           name: `AutoHub-${payload.systemId}`,
//           logicId: `auto-hub-${payload.systemId}`,
//           deviceType: DeviceType.SENSOR_HUB,
//           status: Status.ACTIVE,
//         }),
//       );
//     }

//     const existingSystemVariable = await this.systemVariablesRepository.findOne({
//       where: {
//         systemId: payload.systemId,
//         variableId: variable.variableId,
//       },
//     });

//     if (!existingSystemVariable) {
//       await this.systemVariablesRepository.save(
//         this.systemVariablesRepository.create({
//           systemId: payload.systemId,
//           variableId: variable.variableId,
//           sampleRate: payload.sampleRate ?? 60,
//         }),
//       );
//     }

//     const sensor = this.sensorsRepository.create({
//       deviceId: device.deviceId,
//       variableId: variable.variableId,
//       sensorType: payload.type,
//       status: Status.ACTIVE,
//     });

//     return this.sensorsRepository.save(sensor);
//   }

//   async getSensors(systemId?: number): Promise<Sensor[]> {
//     const qb = this.sensorsRepository
//       .createQueryBuilder('sensor')
//       .leftJoinAndSelect('sensor.device', 'device')
//       .leftJoinAndSelect('device.system', 'system')
//       .leftJoinAndSelect('sensor.variable', 'variable')
//       .leftJoinAndSelect('sensor.alertDefinition', 'alertDefinition')
//       .orderBy('sensor.sensorId', 'DESC');

//     if (systemId) {
//       qb.where('device.system_id = :systemId', { systemId });
//     }

//     return qb.getMany();
//   }

//   async getMeasurements(sensorId?: number): Promise<SensorReading[]> {
//     const qb = this.sensorReadingsRepository
//       .createQueryBuilder('reading')
//       .leftJoinAndSelect('reading.sensor', 'sensor')
//       .leftJoinAndSelect('sensor.variable', 'variable')
//       .leftJoinAndSelect('sensor.device', 'device')
//       .orderBy('reading.timestamp', 'DESC')
//       .take(500);

//     if (sensorId) {
//       qb.where('reading.sensor_id = :sensorId', { sensorId });
//     }

//     return qb.getMany();
//   }

//   async createAlert(payload: CreateAlertDefinitionDto): Promise<AlertDefinition> {
//     if (payload.minValue > payload.maxValue) {
//       throw new BadRequestException('minValue cannot be greater than maxValue');
//     }

//     const variable = await this.variablesRepository.findOne({
//       where: { name: payload.variable },
//     });

//     if (!variable) {
//       throw new NotFoundException(`Variable ${payload.variable} not found`);
//     }

//     let systemVariable = await this.systemVariablesRepository.findOne({
//       where: {
//         systemId: payload.systemId,
//         variableId: variable.variableId,
//       },
//     });

//     if (!systemVariable) {
//       systemVariable = await this.systemVariablesRepository.save(
//         this.systemVariablesRepository.create({
//           systemId: payload.systemId,
//           variableId: variable.variableId,
//           sampleRate: 60,
//         }),
//       );
//     }

//     let alertDefinition = await this.alertDefinitionsRepository.findOne({
//       where: { systemVariableId: systemVariable.systemVariableId },
//     });

//     if (!alertDefinition) {
//       alertDefinition = this.alertDefinitionsRepository.create({
//         systemVariableId: systemVariable.systemVariableId,
//       });
//     }

//     alertDefinition.minValue = payload.minValue;
//     alertDefinition.maxValue = payload.maxValue;

//     const savedDefinition = await this.alertDefinitionsRepository.save(alertDefinition);

//     const sensors = await this.sensorsRepository
//       .createQueryBuilder('sensor')
//       .innerJoin('sensor.device', 'device')
//       .where('device.system_id = :systemId', { systemId: payload.systemId })
//       .andWhere('sensor.variable_id = :variableId', { variableId: variable.variableId })
//       .getMany();

//     if (sensors.length > 0) {
//       const withDefinition = sensors.map((sensor) => ({
//         ...sensor,
//         alertDefinitionId: savedDefinition.alertDefinitionId,
//       }));
//       await this.sensorsRepository.save(withDefinition);
//     }

//     return savedDefinition;
//   }

//   async getAlerts(): Promise<AlertDefinition[]> {
//     return this.alertDefinitionsRepository
//       .createQueryBuilder('alertDefinition')
//       .leftJoinAndSelect('alertDefinition.systemVariable', 'systemVariable')
//       .leftJoinAndSelect('systemVariable.variable', 'variable')
//       .leftJoinAndSelect('systemVariable.system', 'system')
//       .orderBy('alertDefinition.alertDefinitionId', 'DESC')
//       .getMany();
//   }

//   async getStatistics(systemId?: number): Promise<StatisticDto[]> {
//     const qb = this.sensorReadingsRepository
//       .createQueryBuilder('reading')
//       .innerJoin('reading.sensor', 'sensor')
//       .innerJoin('sensor.variable', 'variable')
//       .innerJoin('sensor.device', 'device')
//       .select('variable.variable_id', 'variableId')
//       .addSelect('variable.name', 'variableName')
//       .addSelect('variable.measurement_unit', 'measurementUnit')
//       .addSelect('COUNT(reading.reading_id)', 'readingsCount')
//       .addSelect('AVG(reading.value)', 'avgValue')
//       .addSelect('MIN(reading.value)', 'minValue')
//       .addSelect('MAX(reading.value)', 'maxValue')
//       .addSelect('MAX(reading.timestamp)', 'latestReadingAt')
//       .groupBy('variable.variable_id')
//       .addGroupBy('variable.name')
//       .addGroupBy('variable.measurement_unit')
//       .orderBy('variable.name', 'ASC');

//     if (systemId) {
//       qb.where('device.system_id = :systemId', { systemId });
//     }

//     const raw = await qb.getRawMany<{
//       variableId: string;
//       variableName: string;
//       measurementUnit: string;
//       readingsCount: string;
//       avgValue: string;
//       minValue: string;
//       maxValue: string;
//       latestReadingAt: Date | null;
//     }>();

//     return raw.map((row) => ({
//       variableId: Number(row.variableId),
//       variableName: row.variableName,
//       measurementUnit: row.measurementUnit,
//       readingsCount: Number(row.readingsCount),
//       avgValue: Number(row.avgValue),
//       minValue: Number(row.minValue),
//       maxValue: Number(row.maxValue),
//       latestReadingAt: row.latestReadingAt,
//     }));
//   }

//   async createMeasurement(payload: CreateMeasurementDto): Promise<SensorReading> {
//     const sensor = await this.sensorsRepository.findOne({
//       where: { sensorId: payload.sensorId },
//       relations: {
//         alertDefinition: true,
//       },
//     });

//     if (!sensor) {
//       throw new NotFoundException(`Sensor ${payload.sensorId} not found`);
//     }

//     const reading = this.sensorReadingsRepository.create({
//       sensorId: payload.sensorId,
//       value: payload.value,
//       timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
//     });

//     const savedReading = await this.sensorReadingsRepository.save(reading);

//     if (sensor.alertDefinition) {
//       const { minValue, maxValue } = sensor.alertDefinition;
//       if (savedReading.value < minValue || savedReading.value > maxValue) {
//         const range = maxValue - minValue || 1;
//         const overflow =
//           savedReading.value < minValue
//             ? minValue - savedReading.value
//             : savedReading.value - maxValue;

//         const alertType = overflow > range * 0.2 ? AlertType.DANGEROUS : AlertType.WARNING;

//         await this.alertsRepository.save(
//           this.alertsRepository.create({
//             sensorId: sensor.sensorId,
//             detectedValue: savedReading.value,
//             alertType,
//             status: Status.ACTIVE,
//           }),
//         );
//       }
//     }

//     return savedReading;
//   }

//   async getAlertEvents(systemId?: number): Promise<AlertEventDto[]> {
//     const qb = this.alertsRepository
//       .createQueryBuilder('alert')
//       .innerJoin('alert.sensor', 'sensor')
//       .innerJoin('sensor.variable', 'variable')
//       .innerJoin('sensor.device', 'device')
//       .select('alert.alert_id', 'alertId')
//       .addSelect('alert.sensor_id', 'sensorId')
//       .addSelect('variable.name', 'variableName')
//       .addSelect('alert.detected_value', 'detectedValue')
//       .addSelect('alert.alert_type', 'alertType')
//       .addSelect('alert.creation_date', 'creationDate')
//       .orderBy('alert.creation_date', 'DESC')
//       .take(200);

//     if (systemId) {
//       qb.where('device.system_id = :systemId', { systemId });
//     }

//     const raw = await qb.getRawMany<{
//       alertId: string;
//       sensorId: string;
//       variableName: string;
//       detectedValue: string;
//       alertType: AlertType;
//       creationDate: Date;
//     }>();

//     return raw.map((row) => ({
//       alertId: Number(row.alertId),
//       sensorId: Number(row.sensorId),
//       variableName: row.variableName,
//       detectedValue: Number(row.detectedValue),
//       alertType: row.alertType,
//       creationDate: row.creationDate,
//     }));
//   }

//   private toPublicUser(user: User): PublicUser {
//     return {
//       userId: user.userId,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       status: user.status,
//       creationDate: user.creationDate,
//       updateDate: user.updateDate,
//     };
//   }
// }
