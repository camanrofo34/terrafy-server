import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AlertService } from '../services/alert.service';
import type { CreateAlertDefinitionRequest, UpdateAlertDefinitionRequest } from '../model/dto/request/AlertDefinitionRequest.types';

@ApiTags('Alerts')
@Controller('api/alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post('definitions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create an alert definition',
    description:
      'Creates threshold-based alert definitions for a variable in a system. Automatically links to existing sensors.',
  })
  @ApiBody({
    description: 'Alert definition data',
    schema: {
      type: 'object',
      required: ['systemId', 'variable', 'minValue', 'maxValue'],
      properties: {
        systemId: { type: 'number', example: 1 },
        variable: { type: 'string', example: 'Temperature' },
        minValue: { type: 'number', example: 15 },
        maxValue: { type: 'number', example: 30 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Alert definition created' })
  createAlertDefinition(@Body() payload: CreateAlertDefinitionRequest) {
    return this.alertService.createAlertDefinition(payload);
  }

  @Get('definitions/:alertDefinitionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get alert definition by ID',
    description: 'Retrieves a specific alert definition with associated system variable.',
  })
  @ApiParam({ name: 'alertDefinitionId', description: 'Alert definition ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Definition found' })
  @ApiResponse({ status: 404, description: 'Definition not found' })
  getAlertDefinition(@Param('alertDefinitionId', ParseIntPipe) alertDefinitionId: number) {
    return this.alertService.getAlertDefinitionById(alertDefinitionId);
  }

  @Get('definitions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List all alert definitions',
    description: 'Retrieves paginated list of all alert definitions.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getAllAlertDefinitions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.alertService.getAllAlertDefinitions(page, limit);
  }

  @Get('definitions/system/:systemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get alert definitions by system',
    description: 'Retrieves all alert definitions configured for a specific growing system.',
  })
  @ApiParam({ name: 'systemId', description: 'Growing system ID', example: 1 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getAlertDefinitionsBySystem(
    @Param('systemId', ParseIntPipe) systemId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.alertService.getAlertDefinitionsBySystem(systemId, page, limit);
  }

  @Patch('definitions/:alertDefinitionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update an alert definition',
    description: 'Updates the threshold values of an existing alert definition.',
  })
  @ApiParam({ name: 'alertDefinitionId', description: 'Alert definition ID', example: 1 })
  @ApiBody({
    description: 'Alert definition update data',
    schema: {
      type: 'object',
      properties: {
        minValue: { type: 'number', example: 10 },
        maxValue: { type: 'number', example: 35 },
      },
    },
  })
  updateAlertDefinition(
    @Param('alertDefinitionId', ParseIntPipe) alertDefinitionId: number,
    @Body() payload: UpdateAlertDefinitionRequest,
  ) {
    return this.alertService.updateAlertDefinition(alertDefinitionId, payload);
  }

  @Delete('definitions/:alertDefinitionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete an alert definition',
    description: 'Deletes an alert definition and removes it from associated sensors.',
  })
  @ApiParam({ name: 'alertDefinitionId', description: 'Alert definition ID', example: 1 })
  deleteAlertDefinition(@Param('alertDefinitionId', ParseIntPipe) alertDefinitionId: number) {
    return this.alertService.deleteAlertDefinition(alertDefinitionId);
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get alert events',
    description: 'Retrieves triggered alert events (instances) with optional system filter.',
  })
  @ApiQuery({ name: 'systemId', required: false, description: 'Filter by system ID' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 200 })
  getAlertEvents(
    @Query('systemId') systemId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 200,
  ) {
    const parsedSystemId = systemId ? Number(systemId) : undefined;
    return this.alertService.getAlertEvents(parsedSystemId, page, limit);
  }

  @Get('sensor/:sensorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get alerts by sensor',
    description: 'Retrieves all alerts triggered by a specific sensor.',
  })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', example: 1 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  getAlertsBySensor(
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ) {
    return this.alertService.getAlertsBySensor(sensorId, page, limit);
  }

  @Get(':alertId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get alert by ID',
    description: 'Retrieves a specific alert event with sensor and variable details.',
  })
  @ApiParam({ name: 'alertId', description: 'Alert ID', example: 1 })
  // Note: This requires adding a getAlertById method to AlertService
  getAlert(@Param('alertId', ParseIntPipe) alertId: number) {
    // This would need a dedicated method - placeholder for now
    return { message: 'Use GET /api/alerts/events or /api/alerts/sensor/:sensorId instead' };
  }

  @Patch(':alertId/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Resolve an alert',
    description: 'Marks an alert as resolved (status: INACTIVE).',
  })
  @ApiParam({ name: 'alertId', description: 'Alert ID', example: 1 })
  resolveAlert(@Param('alertId', ParseIntPipe) alertId: number) {
    return this.alertService.resolveAlert(alertId);
  }

  @Delete(':alertId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete an alert event',
    description: 'Permanently deletes an alert event from the database.',
  })
  @ApiParam({ name: 'alertId', description: 'Alert ID', example: 1 })
  deleteAlert(@Param('alertId', ParseIntPipe) alertId: number) {
    return this.alertService.deleteAlert(alertId);
  }

  @Post('cleanup/old-alerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete old alerts',
    description: 'Removes alert events older than the specified number of days.',
  })
  @ApiBody({
    description: 'Cleanup configuration',
    schema: {
      type: 'object',
      required: ['daysOld'],
      properties: {
        daysOld: { type: 'number', example: 90, description: 'Delete alerts older than N days' },
      },
    },
  })
  deleteOldAlerts(@Body() payload: { daysOld: number }) {
    return this.alertService.deleteOldAlerts(payload.daysOld);
  }
}
