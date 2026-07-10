import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true;
    }

    const is2faEnabled = await this.authService.isTwoFactorEnabled(user.userId);
    if (!is2faEnabled) {
      return true;
    }

    // Para operaciones críticas, el código debe venir en el header o body
    const code = request.headers['x-2fa-code'] || request.body.twoFactorCode;

    if (!code) {
      throw new UnauthorizedException('Se requiere código 2FA para completar esta operación crítica');
    }

    try {
      await this.authService.verifyCriticalOperation(user.userId, code);
      return true;
    } catch (error) {
      throw new UnauthorizedException('Código 2FA inválido');
    }
  }
}
