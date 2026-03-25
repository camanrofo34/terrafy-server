import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SensorReadingService } from '../services/sensor-reading.service';
import type { CreateMeasurementRequest, CreateBatchMeasurementRequest } from '../model/dto/request/CreateMeasurementRequest.types';

@ApiTags('Sensor Readings')
@Controller('api/sensor-readings')
export class SensorReadingController {
  constructor(private readonly sensorReadingService: SensorReadingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a sensor reading',
    description:
      'Records a sensor measurement value. Automatically triggers alert checks if thresholds are exceeded.',
  })
  @ApiBody({
    description: 'Sensor measurement data',
    schema: {
      type: 'object',
      required: ['sensorId', 'value'],
      properties: {
        sensorId: { type: 'number', example: 1 },
        value: { type: 'number', example: 27.5, description: 'Measurement value' },
        timestamp: { type: 'string', format: 'date-time', description: 'ISO 8601 timestamp (optional, defaults to now)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Reading created' })
  createMeasurement(@Body() payload: CreateMeasurementRequest) {
    return this.sensorReadingService.createMeasurement(payload);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create multiple sensor readings',
    description: 'Records multiple sensor measurements in a single request. Bulk operation with alert detection.',
  })
  @ApiBody({
    description: 'Batch readings data',
    schema: {
      type: 'object',
      required: ['sensorId', 'readings'],
      properties: {
        sensorId: { type: 'number', example: 1 },
        readings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'number', example: 27.5 },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  createBatchMeasurements(@Body() payload: CreateBatchMeasurementRequest) {
    return this.sensorReadingService.createBatchMeasurements(payload);
  }

  @Get('sensor/:sensorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get readings for a sensor',
    description: 'Retrieves paginated measurements from a specific sensor with optional date filtering.',
  })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', example: 1 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 500 })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter to date (ISO 8601)' })
  getMeasurementsBySensor(
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 500,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.sensorReadingService.getMeasurementsBySensor(sensorId, page, limit, start, end);
  }

  @Get('sensor/:sensorId/latest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get latest reading for a sensor',
    description: 'Retrieves the most recent measurement from a sensor.',
  })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', example: 1 })
  getLatestMeasurement(@Param('sensorId', ParseIntPipe) sensorId: number) {
    return this.sensorReadingService.getLatestMeasurement(sensorId);
  }

  @Get('sensor/:sensorId/recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get recent readings for a sensor',
    description: 'Retrieves the last N measurements from a sensor.',
  })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getRecentMeasurements(
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query('limit') limit: number = 10,
  ) {
    return this.sensorReadingService.getRecentMeasurements(sensorId, limit);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get statistics',
    description: 'Retrieves aggregated statistics (avg, min, max) for all variables across all systems.',
  })
  @ApiQuery({ name: 'systemId', required: false, description: 'Filter by system ID' })
  getStatistics(@Query('systemId') systemId?: string) {
    const parsedSystemId = systemId ? Number(systemId) : undefined;
    return this.sensorReadingService.getStatistics(parsedSystemId);
  }

  @Get('variable/:variableId/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get statistics for a variable',
    description: 'Retrieves aggregated statistics for a specific agronomic variable.',
  })
  @ApiParam({ name: 'variableId', description: 'Variable ID', example: 1 })
  getVariableStatistics(@Param('variableId', ParseIntPipe) variableId: number) {
    return this.sensorReadingService.getVariableStatistics(variableId);
  }

  @Delete(':readingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a reading',
    description: 'Deletes a specific sensor reading from the database.',
  })
  @ApiParam({ name: 'readingId', description: 'Reading ID', example: 1 })
  deleteMeasurement(@Param('readingId', ParseIntPipe) readingId: number) {
    return this.sensorReadingService.deleteMeasurement(readingId);
  }

  @Post('cleanup/old-readings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete old readings',
    description: 'Removes sensor readings older than the specified number of days.',
  })
  @ApiBody({
    description: 'Cleanup configuration',
    schema: {
      type: 'object',
      required: ['daysOld'],
      properties: {
        daysOld: { type: 'number', example: 90, description: 'Delete readings older than N days' },
      },
    },
  })
  deleteOldMeasurements(@Body() payload: { daysOld: number }) {
    return this.sensorReadingService.deleteOldMeasurements(payload.daysOld);
  }
}
