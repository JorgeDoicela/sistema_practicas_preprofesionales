import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Emitesis API v1.0.0 - Ecosistema de Gestión ISTPET';
  }
}
