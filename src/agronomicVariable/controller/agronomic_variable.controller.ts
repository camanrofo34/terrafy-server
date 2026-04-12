import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { AgronomicVariableService } from "../services/agronomic_variable.service";
import type AgronomicVariableRequest from "../model/dto/request/agronomicVariableRequest.types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller('api/agronomic-variables')
export class AgronomicVariableController {

    constructor(
        private readonly agronomicVariableService: AgronomicVariableService
    ){}

    @Post()
    @HttpCode(201)
    @UseGuards(JwtAuthGuard)
    async createAgronomicVariable(@Body() payload: AgronomicVariableRequest ) {
        return await this.agronomicVariableService.createAgronomicVariable(payload);
    }

    @Delete(':variableId')
    @HttpCode(204)
    @UseGuards(JwtAuthGuard)
    async deleteAgronomicVariable(@Param('variableId') variableId: number ) {
        return await this.agronomicVariableService.deleteAgronomicVariable(variableId);
    }

}