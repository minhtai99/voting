import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailsModule } from './mails/mails.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FilesModule } from './files/files.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PollsModule } from './polls/polls.module';
import { ScheduleModule } from '@nestjs/schedule';
import { VotesModule } from './votes/votes.module';
import { AnswerOptionModule } from './answer-option/answer-option.module';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    MailsModule,
    EventEmitterModule.forRoot(),
    FilesModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      exclude: ['/(.*)'],
    }),
    PollsModule,
    ScheduleModule.forRoot(),
    VotesModule,
    AnswerOptionModule,
    CacheModule.register({
      isGlobal: true,
      ttl: parseInt(process.env.CACHE_TLL) * 60000,
      max: parseInt(process.env.CACHE_MAX),
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
