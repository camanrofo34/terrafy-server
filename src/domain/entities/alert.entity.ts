import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlertType } from '../enums/alert-type.enum';
import { Status } from '../enums/status.enum';
import { Sensor } from './sensor.entity';

@Entity({ name: 'alerts' })
@Index('ix_alerts_sensor_id', ['sensorId'])
@Index('ix_alerts_creation_date', ['creationDate'])
export class Alert {
  @PrimaryGeneratedColumn({ name: 'alert_id' })
  alertId: number;

  @Column({ name: 'sensor_id' })
  sensorId: number;

  @Column({ name: 'detected_value', type: 'double' })
  detectedValue: number;

  @Column({
    name: 'alert_type',
    type: 'enum',
    enum: AlertType,
    enumName: 'alert_type_enum',
  })
  alertType: AlertType;

  @Column({
    type: 'enum',
    enum: Status,
    enumName: 'status_enum',
    default: Status.ACTIVE,
  })
  status: Status;

  @CreateDateColumn({ name: 'creation_date', type: 'datetime' })
  creationDate: Date;

  @ManyToOne(() => Sensor, (sensor) => sensor.alerts, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  sensor: Sensor;
}

