import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import AgronomicVariableRequest from "../model/dto/request/agronomicVariableRequest.types";
import { InjectRepository } from "@nestjs/typeorm";
import { AgronomicVariable } from "../../domain/entities";
import { Repository, Like } from "typeorm";
import { PublicAgronomicVariable } from "../model/public/publicAgronomicVariable";

@Injectable()
export class AgronomicVariableService {

    constructor(
        @InjectRepository(AgronomicVariable)
        private agronomicVariableRepository: Repository<AgronomicVariable>
    ){}

    async createAgronomicVariable(payload: AgronomicVariableRequest): Promise<PublicAgronomicVariable> {
        const existingVariable = await this.agronomicVariableRepository.findOne({
            where: { name: payload.name }
        });

        if (existingVariable) {
            throw new ConflictException(`Agronomic variable with name "${payload.name}" already exists`);
        }

        const newVariable = this.agronomicVariableRepository.create({
            name: payload.name,
            measurementUnit: payload.measurementUnit,
            description: payload.description
        });

        const savedVariable = await this.agronomicVariableRepository.save(newVariable);

        return this.toPublicAgronomicVariable(savedVariable);
    } 

    async getAgronomicVariableById(variableId: number): Promise<PublicAgronomicVariable> {
        const variable = await this.agronomicVariableRepository.findOne({ where: { variableId } });

        if (!variable) {
            throw new NotFoundException(`Agronomic variable with ID ${variableId} not found`);
        }

        return this.toPublicAgronomicVariable(variable);
    }

    async getAgronomicVariableByName(name: string): Promise<AgronomicVariable | null> {
        return this.agronomicVariableRepository.findOne({ where: { name } });
    }

    async getAllAgronomicVariables(
        page: number = 1,
        limit: number = 10,
        query?: string,
        sortBy: string = 'creationDate',
        sortOrder: 'ASC' | 'DESC' = 'DESC'
    ): Promise<{ variables: PublicAgronomicVariable[], total: number, page: number, lastPage: number }> {
        const [variables, total] = await this.agronomicVariableRepository.findAndCount({
            where: query ? { name: Like(`%${query}%`) } : {},
            skip: (page - 1) * limit,
            take: limit,
            order: { [sortBy]: sortOrder }
        });

        return {
            variables: variables.map(v => this.toPublicAgronomicVariable(v)),
            total,
            page,
            lastPage: Math.ceil(total / limit)
        };
    }

    async updateAgronomicVariable(variableId: number, payload: Partial<AgronomicVariableRequest>): Promise<PublicAgronomicVariable> {
        const variable = await this.agronomicVariableRepository.findOne({ where: { variableId } });

        if (!variable) {
            throw new NotFoundException(`Agronomic variable with ID ${variableId} not found`);
        }

        if (payload.name && payload.name !== variable.name) {
            const existingVariable = await this.agronomicVariableRepository.findOne({
                where: { name: payload.name }
            });

            if (existingVariable) {
                throw new ConflictException(`Agronomic variable with name "${payload.name}" already exists`);
            }
        }

        const updatedVariable = this.agronomicVariableRepository.merge(variable, payload);
        const savedVariable = await this.agronomicVariableRepository.save(updatedVariable);

        return this.toPublicAgronomicVariable(savedVariable);
    }

    async deleteAgronomicVariable(variableId: number): Promise<void> {
        const variable = await this.agronomicVariableRepository.findOne({ where: { variableId } });

        if (!variable) {
            throw new NotFoundException(`Agronomic variable with ID ${variableId} not found`);
        }

        await this.agronomicVariableRepository.remove(variable);
    }

    async getAgronomicVariable(variableId: number, systemId: number): Promise<PublicAgronomicVariable> {
        const variable = await this.agronomicVariableRepository.findOne({
            where: { variableId },
            relations: ['systemVariables', 'systemVariables.system', 'systemVariables.alertDefinition']
        });
        if (!variable) {
            throw new NotFoundException(`Agronomic variable with ID ${variableId} not found`);
        }
        const publicVar = this.toPublicAgronomicVariable(variable);

        if (systemId && variable.systemVariables && variable.systemVariables.length > 0) {
            const sv = variable.systemVariables.find(s => s.system && s.system.systemId === systemId);
            if (sv && sv.alertDefinition) {
                return {
                    ...publicVar,
                    alertDefinition: {
                        alertDefinitionId: sv.alertDefinition.alertDefinitionId,
                        minValue: sv.alertDefinition.minValue,
                        maxValue: sv.alertDefinition.maxValue,
                    }
                };
            }
        }

        return publicVar;
    }


    private toPublicAgronomicVariable(variable: AgronomicVariable): PublicAgronomicVariable {
        return {
            variableId: variable.variableId,
            name: variable.name,
            measurementUnit: variable.measurementUnit,
            description: variable.description,
            creationDate: variable.creationDate,
            updateDate: variable.updateDate
        };
    }
}