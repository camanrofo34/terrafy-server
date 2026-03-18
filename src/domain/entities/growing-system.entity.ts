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
import { IoTDevice } from './iot-device.entity';
import { SystemVariable } from './system-variable.entity';
import { User } from './user.entity';

@Entity({ name: 'growing_system' })
@Index('ix_growing_systems_user_id', ['userId'])
export class GrowingSystem {
  @PrimaryGeneratedColumn({ name: 'system_id' })
  systemId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 180 })
  ubication: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

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

  @ManyToOne(() => User, (user) => user.growingSystems, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(() => IoTDevice, (device) => device.system, {
    eager: false,
  })
  devices: IoTDevice[];

  @OneToMany(() => SystemVariable, (systemVariable) => systemVariable.system, {
    eager: false,
  })
  systemVariables: SystemVariable[];
}

