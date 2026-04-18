import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { CreateGrowingSystemRequest } from "../model/dto/request/CreateGrowingSystemRequest.types";
import { GrowingSystemService } from "../services/growing_system.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import type { UpdateGrowingSystemRequest } from "../model/dto/request/UpdateGrowingSystemRequest.types";

@Controller('api/growing-systems')
export class GrowingSystemController {

    constructor(
        private readonly growingSystemService: GrowingSystemService
    ){}

    @Post()
    @UseGuards(JwtAuthGuard)
    @HttpCode(201)
    async createGrowingSystem(@Req() req: Request, @Body() payload: CreateGrowingSystemRequest){
        return await this.growingSystemService.createGrowingSystem(payload, (req as any).user);
    }

    @Get(':userId')
    @UseGuards(JwtAuthGuard)
    async getGrowingSystemsByUserId(
        @Req() req: Request,
        @Param('userId') userId: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('query') query?: string,
        @Query('sortBy') sortBy: string = 'creationDate',
        @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC'
    ) {
        return await this.growingSystemService.getGrowingSystemsByUserId(userId, page, limit, (req as any).user, query, sortBy, sortOrder);
    }

    @Patch(':systemId')
    @UseGuards(JwtAuthGuard)
    updateGrowingSystem(@Req() req: Request, @Param('systemId') systemId: number, @Body() payload: UpdateGrowingSystemRequest) {
        return this.growingSystemService.updateGrowingSystem(systemId, payload, (req as any).user);
    }

    @Delete(':systemId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    deleteGrowingSystem(@Param('systemId') systemId: number, @Req() req: Request) {
        return this.growingSystemService.deleteGrowingSystem(systemId, (req as any).user);
    }

    @Get('/system/:systemId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    async getGrowingSystem(@Param('systemId') systemId: number, @Req() req: Request) {
        return await this.growingSystemService.getGrowingSystem(systemId, (req as any).user);
    }

    @Patch(':systemId/variable/:variableId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    associateAgronomicVariable(
        @Param('systemId') systemId: number,
        @Param('variableId') variableId: number,
        @Body() payload: { sampleRate: number }
    ){
        return this.growingSystemService.associateAgronomicVariable(systemId, variableId, payload.sampleRate);
    }

    @Delete(':systemId/variable/:variableId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    disassociateAgronomicVariable(
        @Param('systemId') systemId: number,
        @Param('variableId') variableId: number
    ){
        return this.growingSystemService.disassociateAgronomicVariable(systemId, variableId);
    }

    @Patch(':systemId/variable/:variableId/alert-definition')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    setAlertDefinition(
        @Param('systemId') systemId: number,
        @Param('variableId') variableId: number,
        @Body() payload: { minValue: number, maxValue: number }
    ){
        return this.growingSystemService.setAlertDefinition(systemId, variableId, payload.minValue, payload.maxValue);
    }

    @Get(':systemId/variables/:variableId/history')
    @UseGuards(JwtAuthGuard)
    async getVariableHistory(
        @Param('systemId') systemId: number,
        @Param('variableId') variableId: number
    ) {
        return await this.growingSystemService.getVariableHistory(systemId, variableId);
    }

    @Get(':systemId/variables/:variableId/history/analytics')
    @UseGuards(JwtAuthGuard)
    async getVariableHistoryAnalytics(
        @Param('systemId') systemId: number,
        @Param('variableId') variableId: number,
        @Query('grouping') grouping: 'minutes' | 'hours' | 'days' | 'weeks' = 'hours',
        @Query('start_date') startDate?: string,
        @Query('end_date') endDate?: string,
        @Query('format') format?: 'excel' | 'csv',
        @Res({ passthrough: true }) res?: any,
    ) {
        const result = await this.growingSystemService.getVariableHistoryAnalytics(systemId, variableId, grouping, startDate, endDate, format as any);
        if (result && (result as any).isFile) {
            const r = result as any;
            if (r.contentType) res.setHeader('Content-Type', r.contentType);
            if (r.filename) res.setHeader('Content-Disposition', `attachment; filename="${r.filename}"`);
            if (r.buffer && r.buffer.length) res.setHeader('Content-Length', r.buffer.length.toString());
            return r.buffer;
        }
        return result;
    }

    @Get(':systemId/history/analytics')
    @UseGuards(JwtAuthGuard)
    async getSystemHistoryAnalytics(
        @Param('systemId') systemId: number,
        @Query('grouping') grouping: 'minutes' | 'hours' | 'days' | 'weeks' = 'hours',
        @Query('start_date') startDate?: string,
        @Query('end_date') endDate?: string,
        @Query('format') format?: 'excel' | 'csv',
        @Res({ passthrough: true }) res?: any,
    ) {
        const result = await this.growingSystemService.getSystemHistoryAnalytics(systemId, grouping, startDate, endDate, format as any);
        if (result && (result as any).isFile) {
            const r = result as any;
            if (r.contentType) res.setHeader('Content-Type', r.contentType);
            if (r.filename) res.setHeader('Content-Disposition', `attachment; filename="${r.filename}"`);
            if (r.buffer && r.buffer.length) res.setHeader('Content-Length', r.buffer.length.toString());
            return r.buffer;
        }
        return result;
    }

    @Get(':systemId/alerts')
    @UseGuards(JwtAuthGuard)
    async getSystemAlerts(
        @Param('systemId') systemId: number,
        @Query('variable_id') variableId?: number,
        @Query('start_date') startDate?: string,
        @Query('end_date') endDate?: string,
    ) {
        return await this.growingSystemService.getAlerts(systemId, variableId as any, startDate, endDate);
    }

    @Get('/:systemId/latest')
    @UseGuards(JwtAuthGuard)
    async getLatestVariableValues(@Param('systemId') systemId: number) {
        return await this.growingSystemService.getLatestVariableValues(systemId);
    }
}