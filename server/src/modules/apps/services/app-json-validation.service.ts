import { Injectable } from '@nestjs/common';
import { validateComponentCreateDiff, validateComponentDefinitionUpdate } from '../zod-schemas';

/**
 * Owns Zod validation for app JSON write paths. Thin wrapper over the pure
 * functions in `zod-schemas/` so call sites that cannot take a new constructor
 * dependency (e.g. ComponentsService, which has an EE subclass) can import the
 * functions directly while DI consumers use this service.
 */
@Injectable()
export class AppJsonValidationService {
  validateComponentDiff(diff: Record<string, any>): void {
    validateComponentCreateDiff(diff);
  }

  validateComponentDefinitionUpdate(componentId: string, componentType: string, definition: Record<string, any>): void {
    validateComponentDefinitionUpdate(componentId, componentType, definition);
  }
}
