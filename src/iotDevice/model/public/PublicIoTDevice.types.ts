import { DeviceType } from '../../../domain/enums/device-type.enum';
import { Status } from '../../../domain/enums/status.enum';

export interface PublicIoTDevice {
  deviceId: number;
  systemId: number;
  name: string;
  deviceType: DeviceType;
  logicId?: string;
  status: Status;
  creationDate: Date;
  updateDate: Date;
}
