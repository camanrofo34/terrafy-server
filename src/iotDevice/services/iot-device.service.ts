import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { IoTDevice, GrowingSystem } from '../../domain/entities';
import { DeviceType } from '../../domain/enums/device-type.enum';
import { Status } from '../../domain/enums/status.enum';
import { CreateIoTDeviceRequest } from '../model/dto/request/CreateIoTDeviceRequest.types';
import { UpdateIoTDeviceRequest } from '../model/dto/request/UpdateIoTDeviceRequest.types';
import { PublicIoTDevice } from '../model/public/PublicIoTDevice.types';

@Injectable()
export class IoTDeviceService {
  constructor(
    @InjectRepository(IoTDevice)
    private readonly deviceRepository: Repository<IoTDevice>,
    @InjectRepository(GrowingSystem)
    private readonly systemRepository: Repository<GrowingSystem>,
  ) {}

  async createIoTDevice(payload: CreateIoTDeviceRequest): Promise<PublicIoTDevice> {
    // Validate system exists
    const system = await this.systemRepository.findOne({
      where: { systemId: payload.systemId },
    });

    if (!system) {
      throw new NotFoundException(`Growing system ${payload.systemId} not found`);
    }

    // Check if device with same logicId already exists (if provided)
    if (payload.logicId) {
      const existingDevice = await this.deviceRepository.findOne({
        where: { logicId: payload.logicId },
      });

      if (existingDevice) {
        throw new ConflictException(`Device with logicId "${payload.logicId}" already exists`);
      }
    }

    const newDevice = this.deviceRepository.create({
      systemId: payload.systemId,
      name: payload.name,
      deviceType: payload.deviceType,
      logicId: payload.logicId,
      status: Status.ACTIVE,
    });

    const savedDevice = await this.deviceRepository.save(newDevice);
    return this.toPublicIoTDevice(savedDevice);
  }

  async getIoTDeviceById(deviceId: number): Promise<PublicIoTDevice> {
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`IoT Device ${deviceId} not found`);
    }

    return this.toPublicIoTDevice(device);
  }

  async getDevicesBySystem(
    systemId: number,
    page: number = 1,
    limit: number = 10,
    query?: string,
    sortBy: string = 'creationDate',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ devices: PublicIoTDevice[]; total: number; page: number; lastPage: number }> {
    // Validate system exists
    const system = await this.systemRepository.findOne({
      where: { systemId },
    });

    if (!system) {
      throw new NotFoundException(`Growing system ${systemId} not found`);
    }

    const [devices, total] = await this.deviceRepository.findAndCount({
      where: query
        ? [
            { systemId, status: Status.ACTIVE, name: Like(`%${query}%`) },
            { systemId, status: Status.ACTIVE, logicId: Like(`%${query}%`) },
          ]
        : { systemId, status: Status.ACTIVE },
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
    });

    return {
      devices: devices.map((d) => this.toPublicIoTDevice(d)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getAllIoTDevices(
    page: number = 1,
    limit: number = 10,
    query?: string,
    sortBy: string = 'creationDate',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ devices: PublicIoTDevice[]; total: number; page: number; lastPage: number }> {
    const [devices, total] = await this.deviceRepository.findAndCount({
      where: query
        ? [
            { status: Status.ACTIVE, name: Like(`%${query}%`) },
            { status: Status.ACTIVE, logicId: Like(`%${query}%`) },
          ]
        : { status: Status.ACTIVE },
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
    });

    return {
      devices: devices.map((d) => this.toPublicIoTDevice(d)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getDevicesByType(
    deviceType: DeviceType,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ devices: PublicIoTDevice[]; total: number; page: number; lastPage: number }> {
    const [devices, total] = await this.deviceRepository.findAndCount({
      where: { deviceType, status: Status.ACTIVE },
      skip: (page - 1) * limit,
      take: limit,
      order: { creationDate: 'DESC' },
    });

    return {
      devices: devices.map((d) => this.toPublicIoTDevice(d)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async updateIoTDevice(deviceId: number, payload: UpdateIoTDeviceRequest): Promise<PublicIoTDevice> {
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`IoT Device ${deviceId} not found`);
    }

    // Check if new logicId already exists
    if (payload.logicId && payload.logicId !== device.logicId) {
      const existingDevice = await this.deviceRepository.findOne({
        where: { logicId: payload.logicId },
      });

      if (existingDevice) {
        throw new ConflictException(`Device with logicId "${payload.logicId}" already exists`);
      }
    }

    const updatedDevice = this.deviceRepository.merge(device, payload);
    const savedDevice = await this.deviceRepository.save(updatedDevice);

    return this.toPublicIoTDevice(savedDevice);
  }

  async deleteIoTDevice(deviceId: number): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`IoT Device ${deviceId} not found`);
    }

    device.status = Status.INACTIVE;
    await this.deviceRepository.save(device);
  }

  async activateDevice(deviceId: number): Promise<PublicIoTDevice> {
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`IoT Device ${deviceId} not found`);
    }

    device.status = Status.ACTIVE;
    const savedDevice = await this.deviceRepository.save(device);

    return this.toPublicIoTDevice(savedDevice);
  }

  private toPublicIoTDevice(device: IoTDevice): PublicIoTDevice {
    return {
      deviceId: device.deviceId,
      systemId: device.systemId,
      name: device.name,
      deviceType: device.deviceType,
      logicId: device.logicId,
      status: device.status,
      creationDate: device.creationDate,
      updateDate: device.updateDate,
    };
  }
}
