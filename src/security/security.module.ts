import { Global, Module } from '@nestjs/common';
// import { CaslAbilityFactory } from './casl-ability.factory';
import { RolesGuard } from './guards/roles.guard';
import { AuthGuard } from './guards/auth.guard';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@auth/auth.module';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (ConfigService: ConfigService) => ({
        secret: ConfigService.get('auth.secret'),
        signOptions: { expiresIn: ConfigService.get('auth.expires') },
      }),
    }),
    AuthModule,
  ],
  providers: [RolesGuard, AuthGuard, JwtStrategy],
  exports: [RolesGuard, AuthGuard],
})
export class SecurityModule {}
