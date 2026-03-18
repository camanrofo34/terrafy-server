import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sensor } from './sensor.entity';
import { SystemVariable } from './system-variable.entity';

@Entity({ name: 'alert_definitions' })
@Check('ck_alert_definitions_min_max', 'min_value <= max_value')
@Index('ix_alert_definitions_system_variable_id', ['systemVariableId'])
export class AlertDefinition {
  @PrimaryGeneratedColumn({ name: 'alert_definition_id' })
  alertDefinitionId: number;

  @Column({ name: 'system_variable_id' })
  systemVariableId: number;

  @Column({ name: 'min_value', type: 'double' })
  minValue: number;

  @Column({ name: 'max_value', type: 'double' })
  maxValue: number;

  @CreateDateColumn({ name: 'creation_date', type: 'datetime' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'update_date', type: 'datetime' })
  updateDate: Date;

  @ManyToOne(
    () => SystemVariable,
    (systemVariable) => systemVariable.alertDefinitions,
    {
      eager: false,
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  systemVariable: SystemVariable;

  @OneToMany(() => Sensor, (sensor) => sensor.alertDefinition, {
    eager: false,
  })
  sensors: Sensor[];
}

