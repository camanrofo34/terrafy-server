import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AlertDefinition, GrowingSystem, SensorReading, SystemVariable, User } from "../../domain/entities";
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

    @InjectRepository(AlertDefinition)
    private readonly alertDefinitionRepository: Repository<AlertDefinition>,

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
                'systemVariables.alertDefinition',
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

        const agronomicVariables = (system.systemVariables || []).map((sv) => ({
            variableId: sv.variable.variableId,
            name: sv.variable.name,
            measurementUnit: sv.variable.measurementUnit,
            description: sv.variable.description,
            sampleRate: sv.sampleRate,
            creationDate: sv.variable.creationDate,
            updateDate: sv.variable.updateDate,
            alertDefinition: sv.alertDefinition
                ? {
                      alertDefinitionId: sv.alertDefinition.alertDefinitionId,
                      minValue: sv.alertDefinition.minValue,
                      maxValue: sv.alertDefinition.maxValue,
                  }
                : undefined,
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

    async disassociateAgronomicVariable(systemId: number, variableId: number): Promise<void> {
        const systemVariable = await this.systemVariableRepository.findOne({
            where: { system: { systemId }, variable: { variableId } }
        });
        if (!systemVariable) {
            throw new NotFoundException('System-Variable association not found');
        }

        await this.systemVariableRepository.remove(systemVariable);
    }

    async setAlertDefinition(systemId: number, variableId: number, minValue: number, maxValue: number): Promise<void> {
        const systemVariable = await this.systemVariableRepository.findOne({
            where: { system: { systemId }, variable: { variableId } },
            relations: ['alertDefinition']
        });
        if (!systemVariable) {
            throw new NotFoundException('System-Variable association not found');
        }

        if (systemVariable.alertDefinition) {
            systemVariable.alertDefinition.minValue = minValue;
            systemVariable.alertDefinition.maxValue = maxValue;
            await this.systemVariableRepository.save(systemVariable);
        }
        else {
            const alertDefinition = this.alertDefinitionRepository.create({
                systemVariable: systemVariable,
                minValue,
                maxValue
            });
            await this.alertDefinitionRepository.save(alertDefinition);
            systemVariable.alertDefinition = alertDefinition;
            await this.systemVariableRepository.save(systemVariable);
        }
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

    async getLatestVariableValues(systemId: number): Promise<any> {
        const system = await this.growingSystemRepository.findOne({
            where: { systemId },
        });

        if (!system) {
            throw new NotFoundException('Growing system not found');
        }

        const VARIABLES: Record<string, any> = {
            "1": { variableId: "1", name: "Temperatura", measurementUnit: "°C", field: "environment.temperature_c" },
            "2": { variableId: "2", name: "Humedad Relativa", measurementUnit: "%", field: "environment.rh_percent" },
            "3": { variableId: "3", name: "Déficit de la presión de vapor", measurementUnit: "kPa", field: "environment.vpd_kpa" },
            "4": { variableId: "4", name: "pH", measurementUnit: "pH", field: "sensors.ph" },
            "5": { variableId: "5", name: "Conductividad Eléctrica", measurementUnit: "mS/cm", field: "sensors.ec_ms_cm" },
            "6": { variableId: "6", name: "Oxígeno Disuelto", measurementUnit: "mg/L", field: "sensors.dissolved_o2" },
            "7": { variableId: "7", name: "Nitrógeno", measurementUnit: "mmol/L", field: "concentrations.N" },
            "8": { variableId: "8", name: "Fósforo", measurementUnit: "mmol/L", field: "concentrations.P" },
            "9": { variableId: "9", name: "Potasio", measurementUnit: "mmol/L", field: "concentrations.K" },
            "10": { variableId: "10", name: "Altura del cultivo", measurementUnit: "cm", field: "plant.root_length_cm" },
        };

        const SYSTEMS: Record<string, any> = {
            "1": { systemId: "1", name: "Sistema de Lechugas NFT A", description: "Nutrient Film Technique system for lettuce cultivation" },
            "2": { systemId: "2", name: "Sistema DWC B", description: "Deep Water Culture system for basil production" },
            "3": { systemId: "3", name: "Flujo de fresas C", description: "Ebb and Flow system for strawberry cultivation" },
        };

        const growthStageToSpanish = (stage: string) => {
            switch (stage) {
                case 'seedling': return 'plántula';
                case 'vegetative': return 'vegetativo';
                case 'mature': return 'maduro';
                case 'harvest_ready': return 'listo para cosecha';
                default: return stage;
            }
        };

        const vpdStatusToSpanish = (status: string) => {
            switch (status) {
                case 'too_low': return 'demasiado bajo';
                case 'low': return 'bajo';
                case 'optimal': return 'óptimo';
                case 'high': return 'alto';
                case 'too_high': return 'demasiado alto';
                default: return status;
            }
        };

        const uri = process.env.analytics_ai_uri || 'http://localhost:8000';

        const response = await fetch(`${uri}/analysis/latest?system_id=${systemId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            return { message: 'No se pudo obtener el histórico desde el servicio de análisis' };
        }

        const data = await response.json();

        const processed = (Array.isArray(data) ? data : [data]).map((item: any) => {
            const out = { ...item };

            out.system_name = SYSTEMS[`${systemId}`]?.name || out.system_name || system.name;

            if (out.growth_stage) {
                out.growth_stage = growthStageToSpanish(out.growth_stage);
            }

            if (out.environment && out.environment.vpd_status) {
                out.environment = { ...out.environment, vpd_status: vpdStatusToSpanish(out.environment.vpd_status) };
            }

            return out;
        });

        if (processed.length === 0) return { message: 'No hay datos disponibles' };

        return processed.length === 1 ? processed[0] : processed;
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
        const system = await this.growingSystemRepository.findOne({
            where: { systemId },
        });

        if (!system) {
            throw new NotFoundException('Growing system not found');
        }

        const systemVariable = await this.systemVariableRepository.findOne({
            where: { system: { systemId }, variable: { variableId } },
            relations: ['variable']
        });

        if (!systemVariable) {
            throw new NotFoundException('Variable not associated with this system');
        }

        const VARIABLES: Record<string, any> = {
            "1": { variableId: "1", name: "Temperatura", measurementUnit: "°C", field: "environment.temperature_c" },
            "2": { variableId: "2", name: "Humedad Relativa", measurementUnit: "%", field: "environment.rh_percent" },
            "3": { variableId: "3", name: "Déficit de la presión de vapor", measurementUnit: "kPa", field: "environment.vpd_kpa" },
            "4": { variableId: "4", name: "pH", measurementUnit: "pH", field: "sensors.ph" },
            "5": { variableId: "5", name: "Conductividad Eléctrica", measurementUnit: "mS/cm", field: "sensors.ec_ms_cm" },
            "6": { variableId: "6", name: "Oxígeno Disuelto", measurementUnit: "mg/L", field: "sensors.dissolved_o2" },
            "7": { variableId: "7", name: "Nitrógeno", measurementUnit: "mmol/L", field: "concentrations.N" },
            "8": { variableId: "8", name: "Fósforo", measurementUnit: "mmol/L", field: "concentrations.P" },
            "9": { variableId: "9", name: "Potasio", measurementUnit: "mmol/L", field: "concentrations.K" },
            "10": { variableId: "10", name: "Altura del cultivo", measurementUnit: "cm", field: "plant.root_length_cm" },
        };

        const SYSTEMS: Record<string, any> = {
            "1": { systemId: "1", name: "Sistema de Lechugas NFT A", description: "Nutrient Film Technique system for lettuce cultivation" },
            "2": { systemId: "2", name: "Sistema DWC B", description: "Deep Water Culture system for basil production" },
            "3": { systemId: "3", name: "Flujo de fresas C", description: "Ebb and Flow system for strawberry cultivation" },
        };

        const growthStageToSpanish = (stage: string) => {
            switch (stage) {
                case 'seedling': return 'plántula';
                case 'vegetative': return 'vegetativo';
                case 'mature': return 'maduro';
                case 'harvest_ready': return 'listo para cosecha';
                default: return stage;
            }
        };

        const vpdStatusToSpanish = (status: string) => {
            switch (status) {
                case 'too_low': return 'demasiado bajo';
                case 'low': return 'bajo';
                case 'optimal': return 'óptimo';
                case 'high': return 'alto';
                case 'too_high': return 'demasiado alto';
                default: return status;
            }
        };

        const uri = process.env.analytics_ai_uri || 'http://localhost:8000';

        const payload = {
            system_id: systemId,
            variable_id: variableId,
            system_name: SYSTEMS[`${systemId}`]?.name || system.name,
            variable_name: VARIABLES[`${variableId}`]?.name || (systemVariable.variable?.name || 'variable'),
            variable_field: VARIABLES[`${variableId}`]?.field || null,
        };

        const response = await fetch(`${uri}/analysis/historical`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return { message: 'No se pudo obtener el histórico desde el servicio de análisis' };
        }

        const data = await response.json();

        const processed = (Array.isArray(data) ? data : [data]).map((item: any) => {
            const out = { ...item };

            out.system_name = SYSTEMS[`${systemId}`]?.name || out.system_name || system.name;

            if (out.growth_stage) {
                out.growth_stage = growthStageToSpanish(out.growth_stage);
            }

            if (out.environment && out.environment.vpd_status) {
                out.environment = { ...out.environment, vpd_status: vpdStatusToSpanish(out.environment.vpd_status) };
            }

            out.variable = out.variable || {};
            out.variable.name_es = VARIABLES[`${variableId}`]?.name;
            out.variable.unit_es = VARIABLES[`${variableId}`]?.measurementUnit;

            return out;
        });

        if (processed.length === 0) return { message: 'No hay datos disponibles' };

        return processed.length === 1 ? processed[0] : processed;
    }

    async getVariableHistoryAnalytics(
        systemId: number,
        variableId: number,
        grouping: 'minutes' | 'hours' | 'days' | 'weeks' = 'hours',
        start_date?: string,
        end_date?: string,
        format?: 'excel' | 'csv'
    ) {
        const system = await this.growingSystemRepository.findOne({ where: { systemId } });
        if (!system) throw new NotFoundException('Growing system not found');

        const VARIABLES: Record<string, any> = {
            "1": { variableId: "1", name: "Temperatura", measurementUnit: "°C", field: "environment.temperature_c" },
            "2": { variableId: "2", name: "Humedad Relativa", measurementUnit: "%", field: "environment.rh_percent" },
            "3": { variableId: "3", name: "Déficit de la presión de vapor", measurementUnit: "kPa", field: "environment.vpd_kpa" },
            "4": { variableId: "4", name: "pH", measurementUnit: "pH", field: "sensors.ph" },
            "5": { variableId: "5", name: "Conductividad Eléctrica", measurementUnit: "mS/cm", field: "sensors.ec_ms_cm" },
            "6": { variableId: "6", name: "Oxígeno Disuelto", measurementUnit: "mg/L", field: "sensors.dissolved_o2" },
            "7": { variableId: "7", name: "Nitrógeno", measurementUnit: "mmol/L", field: "concentrations.N" },
            "8": { variableId: "8", name: "Fósforo", measurementUnit: "mmol/L", field: "concentrations.P" },
            "9": { variableId: "9", name: "Potasio", measurementUnit: "mmol/L", field: "concentrations.K" },
            "10": { variableId: "10", name: "Altura del cultivo", measurementUnit: "cm", field: "plant.root_length_cm" },
        };

        const SYSTEMS: Record<string, any> = {
            "1": { systemId: "1", name: "Sistema de Lechugas NFT A" },
            "2": { systemId: "2", name: "Sistema DWC B" },
            "3": { systemId: "3", name: "Flujo de fresas C" },
        };

        const growthStageToSpanish = (stage: string) => {
            switch (stage) {
                case 'seedling': return 'plántula';
                case 'vegetative': return 'vegetativo';
                case 'mature': return 'maduro';
                case 'harvest_ready': return 'listo para cosecha';
                default: return stage;
            }
        };

        const vpdStatusToSpanish = (status: string) => {
            switch (status) {
                case 'too_low': return 'demasiado bajo';
                case 'low': return 'bajo';
                case 'optimal': return 'óptimo';
                case 'high': return 'alto';
                case 'too_high': return 'demasiado alto';
                default: return status;
            }
        };

        const uri = process.env.analytics_ai_uri || 'http://localhost:8000';

        const params = new URLSearchParams();
        params.set('system_id', `${systemId}`);
        params.set('variable_id', `${variableId}`);
        params.set('grouping', grouping);
        if (format) params.set('formato', format);
        if (start_date) params.set('start_date', start_date);
        if (end_date) params.set('end_date', end_date);

        const url = `${uri}/analysis/history?${params.toString()}`;

        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) return { message: 'No se pudo obtener el histórico desde el servicio de análisis' };

        const contentType = response.headers.get('content-type') || '';
        const contentDisp = response.headers.get('content-disposition') || '';

        // If it's a file (non-json) return buffer with metadata so controller can stream it
        if (!contentType.includes('application/json')) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            let filename: string | undefined;
            const m = contentDisp.match(/filename\*=UTF-8''([^;\n\r]+)/) || contentDisp.match(/filename="?([^";]+)"?/);
            if (m) filename = decodeURIComponent(m[1]);
            return { isFile: true, buffer, contentType, filename };
        }

        const data = await response.json();

        const processed = (Array.isArray(data) ? data : [data]).map((item: any) => {
            const out = { ...item };
            out.system_name = SYSTEMS[`${systemId}`]?.name || out.system_name || system.name;
            if (out.growth_stage) out.growth_stage = growthStageToSpanish(out.growth_stage);
            if (out.environment && out.environment.vpd_status) {
                out.environment = { ...out.environment, vpd_status: vpdStatusToSpanish(out.environment.vpd_status) };
            }
            out.variable = out.variable || {};
            out.variable.name_es = VARIABLES[`${variableId}`]?.name;
            out.variable.unit_es = VARIABLES[`${variableId}`]?.measurementUnit;
            return out;
        });

        return processed.length === 1 ? processed[0] : processed;
    }

    async getSystemHistoryAnalytics(
        systemId: number,
        grouping: 'minutes' | 'hours' | 'days' | 'weeks' = 'hours',
        start_date?: string,
        end_date?: string,
        format?: 'excel' | 'csv'
    ) {
        const system = await this.growingSystemRepository.findOne({ where: { systemId } });
        if (!system) throw new NotFoundException('Growing system not found');

        const uri = process.env.analytics_ai_uri || 'http://localhost:8000';

        const params = new URLSearchParams();
        params.set('grouping', grouping);
        if (start_date) params.set('start_date', start_date);
        if (end_date) params.set('end_date', end_date);
        if (format) params.set('formato', format);

        const url = `${uri}/analysis/history/${systemId}?${params.toString()}`;

        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) return { message: 'No se pudo obtener el histórico desde el servicio de análisis' };

        const contentType = response.headers.get('content-type') || '';
        const contentDisp = response.headers.get('content-disposition') || '';

        if (!contentType.includes('application/json')) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            let filename: string | undefined;
            const m = contentDisp.match(/filename\*=UTF-8''([^;\n\r]+)/) || contentDisp.match(/filename="?([^";]+)"?/);
            if (m) filename = decodeURIComponent(m[1]);
            return { isFile: true, buffer, contentType, filename };
        }

        const data = await response.json();

        const SYSTEMS: Record<string, any> = {
            "1": { systemId: "1", name: "Sistema de Lechugas NFT A" },
            "2": { systemId: "2", name: "Sistema DWC B" },
            "3": { systemId: "3", name: "Flujo de fresas C" },
        };

        if (data && typeof data === 'object') {
            if (!data.system_name) data.system_name = SYSTEMS[`${systemId}`]?.name || system.name;
        }

        return data;
    }
}