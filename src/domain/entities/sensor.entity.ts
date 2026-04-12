import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { Status } from '../enums/status.enum';
import { Alert } from './alert.entity';
import { AlertDefinition } from './alert-definition.entity';
import { AgronomicVariable } from './agronomic-variable.entity';
import { IoTDevice } from './iot-device.entity';
import { SensorReading } from './sensor-reading.entity';

@Entity({ name: 'sensors' })
@Index('ix_sensors_device_id', ['device'])
@Index('ix_sensors_variable_id', ['variable'])
@Index('ix_sensors_alert_definition_id', ['alertDefinitionId'])
export class Sensor {
  @PrimaryGeneratedColumn({ name: 'sensor_id' })
  sensorId: number;

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

  // 🔥 RELACIÓN DEVICE
  @ManyToOne(() => IoTDevice, (device) => device.sensors, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device: IoTDevice;

  @RelationId((sensor: Sensor) => sensor.device)
  deviceId: number;

  // 🔥 RELACIÓN VARIABLE
  @ManyToOne(() => AgronomicVariable, (variable) => variable.sensors, {
    eager: false,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'variable_id' })
  variable: AgronomicVariable;

  @RelationId((sensor: Sensor) => sensor.variable)
  variableId: number;

  // 🔥 ALERT DEFINITION
  @ManyToOne(() => AlertDefinition, (alertDefinition) => alertDefinition.sensors, {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'alert_definition_id' })
  alertDefinition?: AlertDefinition;

  // 🔥 RELACIONES HIJAS
  @OneToMany(() => SensorReading, (reading) => reading.sensor, {
    eager: false,
  })
  readings: SensorReading[];

  @OneToMany(() => Alert, (alert) => alert.sensor, {
    eager: false,
  })
  alerts: Alert[];
}