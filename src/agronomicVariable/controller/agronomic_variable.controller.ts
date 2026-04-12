import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AgronomicVariableService } from "../services/agronomic_variable.service";
import type AgronomicVariableRequest from "../model/dto/request/agronomicVariableRequest.types";
import type AgronomicVariableUpdateRequest from "../model/dto/request/agronomicVariableUpdateRequest.types";
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

    @Patch(':variableId')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    async updateAgronomicVariable(@Param('variableId') variableId: number, @Body() payload: AgronomicVariableUpdateRequest ) {
        return await this.agronomicVariableService.updateAgronomicVariable(variableId, payload);
    }

    @Delete(':variableId')
    @HttpCode(204)
    @UseGuards(JwtAuthGuard)
    async deleteAgronomicVariable(@Param('variableId') variableId: number ) {
        return await this.agronomicVariableService.deleteAgronomicVariable(variableId);
    }

    @Get(':variableId/system/:systemId')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    async getAgronomicVariable(@Param('variableId') variableId: number, @Param('systemId') systemId: number) {
        return await this.agronomicVariableService.getAgronomicVariable(variableId, systemId);
    }
}