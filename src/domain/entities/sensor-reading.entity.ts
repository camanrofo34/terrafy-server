import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sensor } from './sensor.entity';

@Entity({ name: 'sensor_readings' })
@Index('ix_sensor_readings_sensor_id', ['sensorId'])
@Index('ix_sensor_readings_timestamp', ['timestamp'])
@Index('ix_sensor_readings_sensor_timestamp', ['sensorId', 'timestamp'])
export class SensorReading {
  @PrimaryGeneratedColumn({ name: 'reading_id' })
  readingId: number;

  @Column({ name: 'sensor_id' })
  sensorId: number;

  @Column({ type: 'double' })
  value: number;

  @Column({ type: 'datetime' })
  timestamp: Date;

  @CreateDateColumn({ name: 'creation_date', type: 'datetime' })
  creationDate: Date;

  @ManyToOne(() => Sensor, (sensor) => sensor.readings, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  sensor: Sensor;
}

