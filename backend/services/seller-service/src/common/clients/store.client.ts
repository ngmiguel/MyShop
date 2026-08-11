import { Injectable, BadRequestException, BadGatewayException } from '@nestjs/common';
import { StoreValidationResult } from '../interfaces';

@Injectable()
export class StoreClient {
  private readonly baseUrl = process.env.STORE_SERVICE_URL || 'http://localhost:3002';

  async validateAccessCode(accessCode: string, storeId?: string): Promise<StoreValidationResult> {
    const url = new URL(`${this.baseUrl}/stores/validate-code/${encodeURIComponent(accessCode)}`);
    if (storeId) {
      url.searchParams.set('storeId', storeId);
    }

    let res: Response;
    try {
      res = await fetch(url.toString());
    } catch {
      throw new BadGatewayException('Store service indisponible');
    }

    if (res.status === 404) {
      throw new BadRequestException('Code d\'accès invalide ou expiré');
    }
    if (!res.ok) {
      throw new BadGatewayException('Erreur lors de la validation du code boutique');
    }

    const data = await res.json() as StoreValidationResult & { valid?: boolean };
    if (!data.valid) {
      throw new BadRequestException('Code d\'accès invalide ou expiré');
    }
    if (storeId && data.storeId !== storeId) {
      throw new BadRequestException('Le code d\'accès ne correspond pas à cette boutique');
    }
    return data;
  }
}
