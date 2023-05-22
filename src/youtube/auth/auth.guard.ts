import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AuthConfig } from 'src/common/configs/config.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(ConfigService) private configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    const authValue = this.configService.get<AuthConfig>('auth').authKey;

    if (authHeader !== authValue) {
      throw new UnauthorizedException('Unauthorized access');
    }
    return true;
  }
}
