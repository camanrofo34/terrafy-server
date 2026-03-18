import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeviceType } from '../enums/device-type.enum';
import { Status } from '../enums/status.enum';
import { GrowingSystem } from './growing-system.entity';
import { Sensor } from './sensor.entity';

@Entity({ name: 'iot_devices' })
@Index('ix_iot_devices_system_id', ['systemId'])
@Index('ux_iot_devices_logic_id', ['logicId'], { unique: true })
export class IoTDevice {
  @PrimaryGeneratedColumn({ name: 'device_id' })
  deviceId: number;

  @Column({ name: 'system_id' })
  systemId: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({
    name: 'device_type',
    type: 'enum',
    enum: DeviceType,
    enumName: 'device_type_enum',
    default: DeviceType.SENSOR_HUB,
  })
  deviceType: DeviceType;

  @Column({ name: 'logic_id', type: 'varchar', length: 120, nullable: true })
  logicId?: string;

  @Column({
    type: 'enum',
    enum: Status,
    enumName: 'status_enum',
    default: Status.ACTIVE,
  })
  status: Status;

  @CreateDateColumn({ name: 'creation_date', type: 'datetime' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'update_date', type: 'datetime' })
  updateDate: Date;

  @ManyToOne(() => GrowingSystem, (system) => system.devices, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  system: GrowingSystem;

  @OneToMany(() => Sensor, (sensor) => sensor.device, {
    eager: false,
  })
  sensors: Sensor[];
}

