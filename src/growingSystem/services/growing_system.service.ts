import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GrowingSystem, SensorReading, SystemVariable, User } from "../../domain/entities";
import { Like, Repository } from "typeorm";
import { UsersService } from "../../users/services/users.service";
import { CreateGrowingSystemRequest } from "../model/dto/request/CreateGrowingSystemRequest.types";
import { Status } from "../../domain/enums/status.enum";
import { PublicGrowingSystem } from "../model/public/PublicGrowingSystem.types";
import { PublicGrowingSystemDetails } from "../model/public/PublicGrowingSystemDetails.types";
import { UpdateGrowingSystemRequest } from "../model/dto/request/UpdateGrowingSystemRequest.types";
import { AgronomicVariableService } from "../../agronomicVariable/services/agronomic_variable.service";
import { Role } from "../../domain/enums/role.enum";
import { In } from 'typeorm';
@Injectable()
export class GrowingSystemService {
    constructor(
    @InjectRepository(GrowingSystem)
    private readonly growingSystemRepository: Repository<GrowingSystem>,

    @InjectRepository(SystemVariable)
    private readonly systemVariableRepository: Repository<SystemVariable>,

    @InjectRepository(SensorReading)
    private readonly sensorReadingRepository: Repository<SensorReading>,

    private readonly agronomicVariableService: AgronomicVariableService,
    private readonly userService: UsersService
) {}

    async createGrowingSystem(payload: CreateGrowingSystemRequest, authUser: User): Promise<PublicGrowingSystem> {
        const user = await this.userService.getUserById(payload.userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.role !== Role.ADMIN && user.userId !== authUser.userId) {
            throw new ForbiddenException('User is not authorized to create a growing system for another user');
        }

        const newSystem = this.growingSystemRepository.create({
            user: user,
            name: payload.name,
            description: payload.description,
            ubication: payload.location,
            status: Status.ACTIVE
        });

        const savedSystem = await this.growingSystemRepository.save(newSystem);
        return {
            systemId: savedSystem.systemId,
            name: savedSystem.name,
            ubication: savedSystem.ubication,
            description: savedSystem.description,
            status: savedSystem.status,
            creationDate: savedSystem.creationDate,
            updateDate: savedSystem.updateDate,
            user: {
                userId: savedSystem.user.userId,
                name: savedSystem.user.name,
                email: savedSystem.user.email
            }
        };
    }

    async getGrowingSystemsByUserId(userId: number, page: number = 1, limit: number = 10, authUser: User, query?: string, sortBy: string = 'creationDate', sortOrder: 'ASC' | 'DESC' = 'DESC'): 
    Promise<{
        systems: PublicGrowingSystem[], total: number, page: number, lastPage: number
    }> {
        if (authUser.role !== Role.ADMIN && authUser.userId !== parseInt(`${userId}`)) {
            throw new ForbiddenException('User is not authorized to view growing systems of another user');
        }
        const [systems, total] = await this.growingSystemRepository.findAndCount({
            where: query
            ? [
                {
                    user: { userId },
                    status: Status.ACTIVE,
                    name: Like(`%${query}%`)
                },
                {
                    user: { userId },
                    status: Status.ACTIVE,
                    description: Like(`%${query}%`)
                }
                ]
            : {
                user: { userId },
                status: Status.ACTIVE
                },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { [sortBy]: sortOrder }
        });

        const data = systems.map(system => ({
            systemId: system.systemId,
            name: system.name,
            ubication: system.ubication,
            description: system.description,
            status: system.status,
            creationDate: system.creationDate,
            updateDate: system.updateDate,
        }));

        return {
            systems: data,
            total,
            page: parseInt(`${page}`),
            lastPage: Math.ceil(total / limit),
        };
    }

    async getGrowingSystem(systemId: number, authUser: User): Promise<PublicGrowingSystemDetails> {
        const system = await this.growingSystemRepository.findOne({
            where: { systemId },
            relations: [
                'systemVariables',
                'systemVariables.variable',
                'user',
                'devices',
                'devices.sensors',
                'devices.sensors.variable'
            ]
        });
        if (!system) {
            throw new NotFoundException('Growing system not found');
        }
        if (authUser.role !== Role.ADMIN && system.user.userId !== parseInt(`${authUser.userId}`)) {
            throw new ForbiddenException('User is not authorized to view this growing system');
        }

        const systemPublic = this.toPublicGrowingSystem(system);

        // Build sensors list from devices -> sensors
        const sensors = [] as any[];
        if (system.devices && system.devices.length > 0) {
            for (const device of system.devices) {
                if (!device.sensors) continue;
                for (const sensor of device.sensors) {
                    sensors.push({
                        sensorId: sensor.sensorId,
                        deviceId: sensor.deviceId,
                        variableId: sensor.variableId,
                        sensorType: sensor.sensorType,
                        status: sensor.status,
                        creationDate: sensor.creationDate,
                        updateDate: sensor.updateDate,
                        device: {
                            deviceId: device.deviceId,
                            name: device.name,
                        },
                        variable: sensor.variable
                            ? {
                                  variableId: sensor.variable.variableId,
                                  name: sensor.variable.name,
                                  measurementUnit: sensor.variable.measurementUnit,
                              }
                            : undefined,
                    });
                }
            }
        }

        // Build agronomic variables list with sampleRate from systemVariables
        const agronomicVariables = (system.systemVariables || []).map((sv) => ({
            variableId: sv.variable.variableId,
            name: sv.variable.name,
            measurementUnit: sv.variable.measurementUnit,
            description: sv.variable.description,
            sampleRate: sv.sampleRate,
            creationDate: sv.variable.creationDate,
            updateDate: sv.variable.updateDate,
        }));

        return {
            system: systemPublic,
            sensors,
            agronomicVariables,
        };
    }

    async updateGrowingSystem(systemId: number, payload: UpdateGrowingSystemRequest, authUser: User): Promise<PublicGrowingSystem> {
        const system = await this.growingSystemRepository.findOne({
            where: { systemId },
            relations: ['user']
        });

        if (!system) {
            throw new NotFoundException('Growing system not found');
        }

        if (authUser.role !== Role.ADMIN && system.user.userId !== parseInt(`${authUser.userId}`)) {
            throw new ForbiddenException('User is not authorized to update this growing system');
        }

        const updatedSystem = this.growingSystemRepository.merge(system, payload);
        const savedSystem = await this.growingSystemRepository.save(updatedSystem);

        return {
            systemId: savedSystem.systemId,
            name: savedSystem.name,
            ubication: savedSystem.ubication,
            description: savedSystem.description,
            status: savedSystem.status,
            creationDate: savedSystem.creationDate,
            updateDate: savedSystem.updateDate,
            user: {
                userId: savedSystem.user.userId,
                name: savedSystem.user.name,
                email: savedSystem.user.email
            }
        };
    }

    async deleteGrowingSystem(systemId: number, authUser: User): Promise<void> {
        const system = await this.growingSystemRepository.findOne({ where: { systemId } });
        if (!system) {
            throw new NotFoundException('Growing system not found');
        }

        if (authUser.role !== Role.ADMIN && system.user.userId !== parseInt(`${authUser.userId}`)) {
            throw new ForbiddenException('User is not authorized to delete this growing system');
        }

        system.status = Status.INACTIVE;
        await this.growingSystemRepository.save(system);
    }

    async associateAgronomicVariable(systemId: number, variableId: number, sampleRate: number = 60): Promise<void> {
        const system = await this.growingSystemRepository.findOne({
            where: { systemId }
        });
        if (!system) {
            throw new NotFoundException('Growing system not found');
        }

        const variable = await this.agronomicVariableService.getAgronomicVariableById(variableId);
        if (!variable) {
            throw new NotFoundException('Agronomic variable not found');
        }

        let systemVariable = await this.systemVariableRepository.findOne({
            where: { system: { systemId }, variable: { variableId } }
        });

        if (systemVariable) {
            systemVariable.sampleRate = sampleRate;
        }
        else {
            systemVariable = this.systemVariableRepository.create({
                system: { systemId },
                variable: { variableId },
                sampleRate
            });
        }
        await this.systemVariableRepository.save(systemVariable);
    }

    async getAllGrowingSystems(
        page: number = 1,
        limit: number = 10,
        query?: string,
        sortBy: string = 'creationDate',
        sortOrder: 'ASC' | 'DESC' = 'DESC'
    ): Promise<{
        systems: PublicGrowingSystem[], total: number, page: number, lastPage: number
    }> {
        const [systems, total] = await this.growingSystemRepository.findAndCount({
            where: query
                ? [
                    {
                        status: Status.ACTIVE,
                        name: Like(`%${query}%`)
                    },
                    {
                        status: Status.ACTIVE,
                        description: Like(`%${query}%`)
                    }
                ]
                : { status: Status.ACTIVE },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: { [sortBy]: sortOrder }
        });

        const data = systems.map(system => this.toPublicGrowingSystem(system));

        return {
            systems: data,
            total,
            page: parseInt(`${page}`),
            lastPage: Math.ceil(total / limit),
        };
    }

    async getGrowingSystemById(systemId: number): Promise<PublicGrowingSystem> {
        const system = await this.growingSystemRepository.findOne({
            where: { systemId },
            relations: ['user']
        });

        if (!system) {
            throw new NotFoundException('Growing system not found');
        }

        return this.toPublicGrowingSystem(system);
    }

    async getSystemVariables(systemId: number): Promise<SystemVariable[]> {
        const system = await this.growingSystemRepository.findOne({
            where: { systemId }
        });

        if (!system) {
            throw new NotFoundException('Growing system not found');
        }

        return this.systemVariableRepository.find({
            where: { system: { systemId } },
            relations: ['variable']
        });
    }

    async removeAgronomicVariable(systemId: number, variableId: number): Promise<void> {
        const systemVariable = await this.systemVariableRepository.findOne({
            where: {
                system: { systemId },
                variable: { variableId }
            }
        });

        if (!systemVariable) {
            throw new NotFoundException('System-Variable association not found');
        }

        await this.systemVariableRepository.remove(systemVariable);
    }

    private toPublicGrowingSystem(system: GrowingSystem): PublicGrowingSystem {
        return {
            systemId: system.systemId,
            name: system.name,
            ubication: system.ubication,
            description: system.description,
            status: system.status,
            creationDate: system.creationDate,
            updateDate: system.updateDate,
            user: {
                userId: system.user.userId,
                name: system.user.name,
                email: system.user.email
            }
        };
    }
    
    async getVariableHistory(systemId: number, variableId: number) {

  // 1. validar sistema
  const system = await this.growingSystemRepository.findOne({
    where: { systemId },
  });

  if (!system) {
    throw new NotFoundException('Growing system not found');
  }

  // 2. validar relación sistema-variable
  const systemVariable = await this.systemVariableRepository.findOne({
    where: {
      systemId,
      variableId,
    },
  });

  if (!systemVariable) {
    throw new NotFoundException('Variable not associated with this system');
  }

  // 3. traer historial directamente (SIN hacks de sensorIds)
  const readings = await this.sensorReadingRepository
    .createQueryBuilder('reading')
    .innerJoin('reading.sensor', 'sensor')
    .innerJoin('sensor.variable', 'variable')
    .innerJoin('sensor.device', 'device')
    .where('device.system_id = :systemId', { systemId })
    .andWhere('variable.variable_id = :variableId', { variableId })
    .orderBy('reading.timestamp', 'ASC')
    .getMany();

  // 4. respuesta limpia
  if (readings.length === 0) {
    return { message: 'No hay datos disponibles' };
  }

  return readings;
}
}