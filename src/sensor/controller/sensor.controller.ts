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
import { SensorService } from '../services/sensor.service';
import type { RegisterSensorRequest, CreateSensorRequest } from '../model/dto/request/SensorRequest.types';
import type { UpdateSensorRequest } from '../model/dto/request/UpdateSensorRequest.types';

@ApiTags('Sensors')
@Controller('api/sensors')
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Register a new sensor',
    description:
      'Registers a sensor for a growing system. Automatically creates/links agronomic variable and auto-hub device if needed.',
  })
  @ApiBody({
    description: 'Sensor registration data',
    schema: {
      type: 'object',
      required: ['systemId', 'type', 'unit'],
      properties: {
        systemId: { type: 'number', example: 1 },
        type: { type: 'string', example: 'Temperature' },
        unit: { type: 'string', example: '°C' },
        sampleRate: { type: 'number', example: 60, description: 'Sample rate in seconds (default: 60)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Sensor registered successfully' })
  registerSensor(@Body() payload: RegisterSensorRequest) {
    return this.sensorService.registerSensor(payload);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a sensor',
    description: 'Creates a sensor by linking an existing device and agronomic variable.',
  })
  @ApiBody({
    description: 'Sensor creation data',
    schema: {
      type: 'object',
      required: ['deviceId', 'variableId', 'sensorType'],
      properties: {
        deviceId: { type: 'number', example: 1 },
        variableId: { type: 'number', example: 1 },
        sensorType: { type: 'string', example: 'DHT22' },
      },
    },
  })
  createSensor(@Body() payload: CreateSensorRequest) {
    return this.sensorService.createSensor(payload);
  }

  @Get(':sensorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get sensor by ID',
    description: 'Retrieves a specific sensor with device and variable details.',
  })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sensor found' })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  getSensor(@Param('sensorId', ParseIntPipe) sensorId: number) {
    return this.sensorService.getSensorById(sensorId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List all sensors',
    description: 'Retrieves paginated list of all sensors with optional search.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'query', required: false, description: 'Search by sensor type' })
  getAllSensors(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('query') query?: string,
  ) {
    return this.sensorService.getAllSensors(page, limit, query);
  }

  @Get('system/:systemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get sensors by system',
    description: 'Retrieves all sensors for a specific growing system.',
  })
  @ApiParam({ name: 'systemId', description: 'Growing system ID', example: 1 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getSensorsBySystem(
    @Param('systemId', ParseIntPipe) systemId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.sensorService.getSensorsBySystem(systemId, page, limit);
  }

  @Get('device/:deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get sensors by device',
    description: 'Retrieves all sensors associated with a specific IoT device.',
  })
  @ApiParam({ name: 'deviceId', description: 'Device ID', example: 1 })
  getSensorsByDevice(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.sensorService.getSensorsByDevice(deviceId, page, limit);
  }

  @Patch(':sensorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update a sensor',
    description: 'Updates a sensor properties.',
  })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', example: 1 })
  @ApiBody({
    description: 'Sensor update data',
    schema: {
      type: 'object',
      properties: {
        sensorType: { type: 'string', example: 'DHT22' },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
      },
    },
  })
  updateSensor(@Param('sensorId', ParseIntPipe) sensorId: number, @Body() payload: UpdateSensorRequest) {
    return this.sensorService.updateSensor(sensorId, payload);
  }

  @Delete(':sensorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a sensor',
    description: 'Soft-deletes a sensor (sets status to INACTIVE).',
  })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', example: 1 })
  deleteSensor(@Param('sensorId', ParseIntPipe) sensorId: number) {
    return this.sensorService.deleteSensor(sensorId);
  }

  @Patch(':sensorId/alert-definition/:alertDefinitionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Assign alert definition to sensor',
    description: 'Links an alert definition to a sensor for threshold monitoring.',
  })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', example: 1 })
  @ApiParam({ name: 'alertDefinitionId', description: 'Alert definition ID', example: 1 })
  assignAlertDefinition(
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Param('alertDefinitionId', ParseIntPipe) alertDefinitionId: number,
  ) {
    return this.sensorService.assignAlertDefinition(sensorId, alertDefinitionId);
  }

  @Delete(':sensorId/alert-definition')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Remove alert definition from sensor',
    description: 'Unlinks the alert definition from a sensor.',
  })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', example: 1 })
  removeAlertDefinition(@Param('sensorId', ParseIntPipe) sensorId: number) {
    return this.sensorService.removeAlertDefinition(sensorId);
  }
}
