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
import { IoTDeviceService } from '../services/iot-device.service';
import type { CreateIoTDeviceRequest } from '../model/dto/request/CreateIoTDeviceRequest.types';
import type { UpdateIoTDeviceRequest } from '../model/dto/request/UpdateIoTDeviceRequest.types';
import { DeviceType } from '../../domain/enums/device-type.enum';

@ApiTags('IoT Devices')
@Controller('api/iot-devices')
export class IoTDeviceController {
  constructor(private readonly iotDeviceService: IoTDeviceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a new IoT device',
    description: 'Creates a new IoT device (sensor hub or gateway) for a growing system.',
  })
  @ApiBody({
    description: 'IoT device data',
    schema: {
      type: 'object',
      required: ['systemId', 'name', 'deviceType'],
      properties: {
        systemId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Main Sensor Hub' },
        deviceType: { type: 'string', enum: ['SENSOR_HUB', 'GATEWAY'], example: 'SENSOR_HUB' },
        logicId: { type: 'string', example: 'hub-greenhouse-01' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Device created successfully' })
  createIoTDevice(@Body() payload: CreateIoTDeviceRequest) {
    return this.iotDeviceService.createIoTDevice(payload);
  }

  @Get(':deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get IoT device by ID',
    description: 'Retrieves a specific IoT device by its ID.',
  })
  @ApiParam({ name: 'deviceId', description: 'Device ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Device found' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  getIoTDevice(@Param('deviceId', ParseIntPipe) deviceId: number) {
    return this.iotDeviceService.getIoTDeviceById(deviceId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List all IoT devices',
    description: 'Retrieves paginated list of all IoT devices with optional search and sorting.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'query', required: false, description: 'Search by name or logicId' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'creationDate' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  getAllIoTDevices(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('query') query?: string,
    @Query('sortBy') sortBy: string = 'creationDate',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    return this.iotDeviceService.getAllIoTDevices(page, limit, query, sortBy, sortOrder);
  }

  @Get('system/:systemId/devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get devices by system',
    description: 'Retrieves all IoT devices associated with a specific growing system.',
  })
  @ApiParam({ name: 'systemId', description: 'Growing system ID', example: 1 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getDevicesBySystem(
    @Param('systemId', ParseIntPipe) systemId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.iotDeviceService.getDevicesBySystem(systemId, page, limit);
  }

  @Patch(':deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update an IoT device',
    description: 'Updates an existing IoT device properties.',
  })
  @ApiParam({ name: 'deviceId', description: 'Device ID', example: 1 })
  @ApiBody({
    description: 'Device update data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated Hub Name' },
        deviceType: { type: 'string', enum: ['SENSOR_HUB', 'GATEWAY'] },
        logicId: { type: 'string', example: 'updated-logic-id' },
      },
    },
  })
  updateIoTDevice(@Param('deviceId', ParseIntPipe) deviceId: number, @Body() payload: UpdateIoTDeviceRequest) {
    return this.iotDeviceService.updateIoTDevice(deviceId, payload);
  }

  @Delete(':deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete an IoT device',
    description: 'Soft-deletes an IoT device (sets status to INACTIVE).',
  })
  @ApiParam({ name: 'deviceId', description: 'Device ID', example: 1 })
  deleteIoTDevice(@Param('deviceId', ParseIntPipe) deviceId: number) {
    return this.iotDeviceService.deleteIoTDevice(deviceId);
  }

  @Patch(':deviceId/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Activate a device',
    description: 'Reactivates a previously deactivated IoT device.',
  })
  @ApiParam({ name: 'deviceId', description: 'Device ID', example: 1 })
  activateDevice(@Param('deviceId', ParseIntPipe) deviceId: number) {
    return this.iotDeviceService.activateDevice(deviceId);
  }
}
