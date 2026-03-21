import { Injectable } from "@nestjs/common";
import AgronomicVariableRequest from "../model/dto/request/agronomicVariableRequest.types";
import { InjectRepository } from "@nestjs/typeorm";
import { AgronomicVariable } from "../../domain/entities";
import { Repository } from "typeorm";
import { PublicAgronomicVariable } from "../model/public/publicAgronomicVariable";

@Injectable()
export class AgronomicVariableService {

    constructor(
        @InjectRepository(AgronomicVariable)
        private agronomicVariableRepository: Repository<AgronomicVariable>
    ){}

    async createAgronomicVariable(payload: AgronomicVariableRequest): Promise<PublicAgronomicVariable> {
        const newVariable = this.agronomicVariableRepository.create({
            name: payload.name,
            measurementUnit: payload.measurementUnit,
            description: payload.description
        });

        const savedVariable = await this.agronomicVariableRepository.save(newVariable);

        return {
            variableId: savedVariable.variableId,
            name: savedVariable.name,
            measurementUnit: savedVariable.measurementUnit,
            description: savedVariable.description,
            creationDate: savedVariable.creationDate,
            updateDate: savedVariable.updateDate
        };
    } 

    async getAgronomicVariableById(variableId: number): Promise<PublicAgronomicVariable> {
        const variable = await this.agronomicVariableRepository.findOne({ where: { variableId } });

        if (!variable) {
            throw new Error('Agronomic variable not found');
        }

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