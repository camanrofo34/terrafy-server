import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Alert,
  AlertDefinition,
  AgronomicVariable,
  GrowingSystem,
  IoTDevice,
  Sensor,
  SensorReading,
  SystemVariable,
  User,
} from './domain/entities';
import { UsersController } from './users/controller/users.controller';
import { UsersService } from './users/services/users.service';
import { AuthService } from './users/services/auth.service';
import { BcryptService } from './users/services/bcrypt.service';
import { GrowingSystemController } from './growingSystem/controller/growing_system.controller';
import { GrowingSystemService } from './growingSystem/services/growing_system.service';
import { AgronomicVariableController } from './agronomicVariable/controller/agronomic_variable.controller';
import { AgronomicVariableService } from './agronomicVariable/services/agronomic_variable.service';
import { IoTDeviceService } from './iotDevice/services/iot-device.service';
import { IoTDeviceController } from './iotDevice/controller/iot-device.controller';
import { SensorService } from './sensor/services/sensor.service';
import { SensorController } from './sensor/controller/sensor.controller';
import { SensorReadingService } from './sensorReading/services/sensor-reading.service';
import { SensorReadingController } from './sensorReading/controller/sensor-reading.controller';
import { AlertService } from './alert/services/alert.service';
import { AlertController } from './alert/controller/alert.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'terrafy',
      ssl: { rejectUnauthorized: false },  
      entities: [
        User,
        GrowingSystem,
        IoTDevice,
        AgronomicVariable,
        SystemVariable,
        AlertDefinition,
        Sensor,
        SensorReading,
        Alert,
      ],
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      User,
      GrowingSystem,
      IoTDevice,
      AgronomicVariable,
      SystemVariable,
      AlertDefinition,
      Sensor,
      SensorReading,
      Alert,
    ]),
  ],
  controllers: [
    UsersController,
    GrowingSystemController,
    AgronomicVariableController,
    IoTDeviceController,
    SensorController,
    SensorReadingController,
    AlertController,
  ],
  providers: [
    UsersService,
    AuthService,
    BcryptService,
    GrowingSystemService,
    AgronomicVariableService,
    IoTDeviceService,
    SensorService,
    SensorReadingService,
    AlertService,
  ],
})
export class AppModule {}
