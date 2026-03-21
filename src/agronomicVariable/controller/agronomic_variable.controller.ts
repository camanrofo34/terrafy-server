import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
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
}