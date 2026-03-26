import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GrowingSystem, SystemVariable } from "../../domain/entities";
import { Like, Repository } from "typeorm";
import { UsersService } from "../../users/services/users.service";
import { CreateGrowingSystemRequest } from "../model/dto/request/CreateGrowingSystemRequest.types";
import { Status } from "../../domain/enums/status.enum";
import { PublicGrowingSystem } from "../model/public/PublicGrowingSystem.types";
import { UpdateGrowingSystemRequest } from "../model/dto/request/UpdateGrowingSystemRequest.types";
import { AgronomicVariableService } from "../../agronomicVariable/services/agronomic_variable.service";

@Injectable()
export class GrowingSystemService {
    constructor(
        @InjectRepository(GrowingSystem)
        private readonly growingSystemRepository: Repository<GrowingSystem>,
        @InjectRepository(SystemVariable)
        private readonly systemVariableRepository: Repository<SystemVariable>,
        private readonly agronomicVariableService: AgronomicVariableService,
        private readonly userService: UsersService
    ){}

    async createGrowingSystem(payload: CreateGrowingSystemRequest): Promise<PublicGrowingSystem> {
        const user = await this.userService.getUserById(payload.userId);
        if (!user) {
            throw new NotFoundException('User not found');
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

    async getGrowingSystemsByUserId(userId: number, page: number = 1, limit: number = 10, query?: string, sortBy: string = 'creationDate', sortOrder: 'ASC' | 'DESC' = 'DESC'): 
    Promise<{
        systems: PublicGrowingSystem[], total: number, page: number, lastPage: number
    }> {
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
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async updateGrowingSystem(systemId: number, payload: UpdateGrowingSystemRequest): Promise<PublicGrowingSystem> {
        const system = await this.growingSystemRepository.findOne({
            where: { systemId },
            relations: ['user']
        });

        if (!system) {
            throw new NotFoundException('Growing system not found');
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

    async deleteGrowingSystem(systemId: number): Promise<void> {
        const system = await this.growingSystemRepository.findOne({ where: { systemId } });
        if (!system) {
            throw new NotFoundException('Growing system not found');
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
            page,
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

}