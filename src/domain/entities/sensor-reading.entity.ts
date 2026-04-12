import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { Sensor } from './sensor.entity';

@Entity({ name: 'sensor_readings' })
@Index('ix_sensor_readings_sensor_id', ['sensor'])
@Index('ix_sensor_readings_timestamp', ['timestamp'])
@Index('ix_sensor_readings_sensor_timestamp', ['sensor', 'timestamp'])
export class SensorReading {
  @PrimaryGeneratedColumn({ name: 'reading_id' })
  readingId: number;

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
  @JoinColumn({ name: 'sensor_id' })
  sensor: Sensor;

  // 👇 ESTO REEMPLAZA sensorId
  @RelationId((reading: SensorReading) => reading.sensor)
  sensorId: number;
}

