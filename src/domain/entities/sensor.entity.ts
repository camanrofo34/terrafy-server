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
import { Status } from '../enums/status.enum';
import { Alert } from './alert.entity';
import { AlertDefinition } from './alert-definition.entity';
import { AgronomicVariable } from './agronomic-variable.entity';
import { IoTDevice } from './iot-device.entity';
import { SensorReading } from './sensor-reading.entity';

@Entity({ name: 'sensors' })
@Index('ix_sensors_device_id', ['deviceId'])
@Index('ix_sensors_variable_id', ['variableId'])
@Index('ix_sensors_alert_definition_id', ['alertDefinitionId'])
export class Sensor {
  @PrimaryGeneratedColumn({ name: 'sensor_id' })
  sensorId: number;

  @Column({ name: 'device_id' })
  deviceId: number;

  @Column({ name: 'variable_id' })
  variableId: number;

  @Column({ name: 'alert_definition_id', nullable: true })
  alertDefinitionId?: number;

  @Column({ name: 'sensor_type', type: 'varchar', length: 80 })
  sensorType: string;

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

  @ManyToOne(() => IoTDevice, (device) => device.sensors, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  device: IoTDevice;

  @ManyToOne(() => AgronomicVariable, (variable) => variable.sensors, {
    eager: false,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  variable: AgronomicVariable;

  @ManyToOne(() => AlertDefinition, (alertDefinition) => alertDefinition.sensors, {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  alertDefinition?: AlertDefinition;

  @OneToMany(() => SensorReading, (reading) => reading.sensor, {
    eager: false,
  })
  readings: SensorReading[];

  @OneToMany(() => Alert, (alert) => alert.sensor, {
    eager: false,
  })
  alerts: Alert[];
}

