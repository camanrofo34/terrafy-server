import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sensor } from './sensor.entity';
import { SystemVariable } from './system-variable.entity';

@Entity({ name: 'agronomic_variables' })
@Index('ux_agronomic_variables_name', ['name'], { unique: true })
export class AgronomicVariable {
  @PrimaryGeneratedColumn({ name: 'variable_id' })
  variableId: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'measurement_unit', type: 'varchar', length: 60 })
  measurementUnit: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'creation_date', type: 'datetime' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'update_date', type: 'datetime' })
  updateDate: Date;

  @OneToMany(() => SystemVariable, (systemVariable) => systemVariable.variable, {
    eager: false,
  })
  systemVariables: SystemVariable[];

  @OneToMany(() => Sensor, (sensor) => sensor.variable, {
    eager: false,
  })
  sensors: Sensor[];
}

