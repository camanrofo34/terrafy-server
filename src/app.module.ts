import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiCenterController } from './api-center/api-center.controller';
import { ApiCenterService } from './api-center/api-center.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
      logging: false,
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
  controllers: [AppController, UsersController],
  providers: [AppService, ApiCenterService, UsersService, AuthService, BcryptService],
})
export class AppModule {}
