import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { appConfig, databaseConfig, jwtConfig, storageConfig, emailConfig, validate } from './config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma';
import { EmailModule } from './modules/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { UploadModule } from './modules/upload/upload.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { TeamModule } from './modules/team/team.module';
import { WorkLocationModule } from './modules/work-location/work-location.module';
import { ReportModule } from './modules/report/report.module';
import { DivisionModule } from './modules/division/division.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      load: [appConfig, databaseConfig, jwtConfig, storageConfig, emailConfig],
      validate,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('app.nodeEnv');
        const isDev = nodeEnv === 'development';

        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            transport: isDev
              ? { target: 'pino-pretty', options: { colorize: true } }
              : undefined,
          },
        };
      },
    }),
    PrismaModule,
    EmailModule,
    AuthModule,
    UserModule,
    RbacModule,
    UploadModule,
    AttendanceModule,
    TeamModule,
    WorkLocationModule,
    ReportModule,
    DivisionModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
