import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import type {
  CreateAlertDefinitionDto,
  CreateGrowingSystemDto,
  CreateMeasurementDto,
  CreateUserDto,
  LoginDto,
  RegisterSensorDto,
} from './api-center.types';
import { ApiCenterService } from './api-center.service';

@Controller('api')
export class ApiCenterController {
  constructor(private readonly apiCenterService: ApiCenterService) {}

  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.apiCenterService.login(payload);
  }

  @Post('users')
  createUser(@Body() payload: CreateUserDto) {
    return this.apiCenterService.createUser(payload);
  }

  @Get('users/:userId')
  getUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.apiCenterService.getUser(userId);
  }

  @Post('growing-systems')
  createGrowingSystem(@Body() payload: CreateGrowingSystemDto) {
    return this.apiCenterService.createGrowingSystem(payload);
  }

  @Get('growing-systems')
  getGrowingSystems() {
    return this.apiCenterService.getGrowingSystems();
  }

  @Post('sensors/register')
  registerSensor(@Body() payload: RegisterSensorDto) {
    return this.apiCenterService.registerSensor(payload);
  }

  @Get('sensors')
  getSensors(@Query('systemId') systemId?: string) {
    const parsedSystemId = systemId ? Number(systemId) : undefined;
    return this.apiCenterService.getSensors(parsedSystemId);
  }

  @Get('growing-systems/:systemId/sensors')
  getSystemSensors(@Param('systemId', ParseIntPipe) systemId: number) {
    return this.apiCenterService.getSensors(systemId);
  }

  @Get('measurements')
  getMeasurements(@Query('sensorId') sensorId?: string) {
    const parsedSensorId = sensorId ? Number(sensorId) : undefined;
    return this.apiCenterService.getMeasurements(parsedSensorId);
  }

  @Post('measurements')
  createMeasurement(@Body() payload: CreateMeasurementDto) {
    return this.apiCenterService.createMeasurement(payload);
  }

  @Post('alerts/definitions')
  createAlert(@Body() payload: CreateAlertDefinitionDto) {
    return this.apiCenterService.createAlert(payload);
  }

  @Get('alerts/definitions')
  getAlertDefinitions() {
    return this.apiCenterService.getAlerts();
  }

  @Get('alerts/events')
  getAlertEvents(@Query('systemId') systemId?: string) {
    const parsedSystemId = systemId ? Number(systemId) : undefined;
    return this.apiCenterService.getAlertEvents(parsedSystemId);
  }

  @Get('statistics')
  getStatistics(@Query('systemId') systemId?: string) {
    const parsedSystemId = systemId ? Number(systemId) : undefined;
    return this.apiCenterService.getStatistics(parsedSystemId);
  }

  @Get('statistics/system/:systemId')
  getSystemStatistics(@Param('systemId', ParseIntPipe) systemId: number) {
    return this.apiCenterService.getStatistics(systemId);
  }
}
