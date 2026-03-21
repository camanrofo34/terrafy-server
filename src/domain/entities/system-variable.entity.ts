import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AlertDefinition } from './alert-definition.entity';
import { AgronomicVariable } from './agronomic-variable.entity';
import { GrowingSystem } from './growing-system.entity';

@Entity({ name: 'system_variables' })
@Index('ux_system_variables_system_variable', ['systemId', 'variableId'], {
  unique: true,
})
@Index('ix_system_variables_system_id', ['systemId'])
@Index('ix_system_variables_variable_id', ['variableId'])
export class SystemVariable {
  @PrimaryGeneratedColumn({ name: 'system_variable_id' })
  systemVariableId: number;

  @Column({ name: 'sample_rate', type: 'integer', default: 60 })
  sampleRate: number;

  @CreateDateColumn({ name: 'creation_date', type: 'datetime' })
  creationDate: Date;

  @UpdateDateColumn({ name: 'update_date', type: 'datetime' })
  updateDate: Date;

  @Column({ name: 'system_id', type: 'integer' })
  systemId: number;

  @Column({ name: 'variable_id', type: 'integer' })
  variableId: number;

  @ManyToOne(() => GrowingSystem, (system) => system.systemVariables, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'system_id' })
  system: GrowingSystem;

  @ManyToOne(() => AgronomicVariable, (variable) => variable.systemVariables, {
    eager: false,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'variable_id' })
  variable: AgronomicVariable;

  @OneToMany(
    () => AlertDefinition,
    (alertDefinition) => alertDefinition.systemVariable,
    {
      eager: false,
    },
  )
  alertDefinitions: AlertDefinition[];
}

