import { Injectable, Type } from '@nestjs/common';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { MetadataScanner } from '@nestjs/core';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { GUARDS_METADATA } from '@nestjs/common/constants';

@Injectable()
// Validates if all routes are guarded with AbilityGuard
export class GuardValidator {
  private unprotectedRoutes: string[] = [];

  constructor(private readonly metadataScanner: MetadataScanner, private readonly modulesContainer: ModulesContainer) {}
  async validateJwtGuard() {
    console.log('Validating if all routes are guarded with AbilityGuard');

    try {
      const controllers = [];
      this.modulesContainer.forEach((module) => {
        const moduleControllers = [...module.controllers.values()];
        controllers.push(...moduleControllers);
      });

      console.log('Discovered Controllers:', controllers.length);

      for (const controller of controllers) {
        if (!controller.instance || !controller.metatype) continue;

        // Get controller-level guards using the constant
        const controllerGuards = Reflect.getMetadata(GUARDS_METADATA, controller.metatype) || [];

        // Get the controller's prefix
        const prefix = Reflect.getMetadata('path', controller.metatype) || '';

        // Get all route handlers
        const prototype = Object.getPrototypeOf(controller.instance);
        const methods = this.metadataScanner.getAllMethodNames(prototype);

        for (const method of methods) {
          // Get the route metadata
          const path = Reflect.getMetadata('path', prototype[method]);
          const requestMethod = this.getRequestMethodName(Reflect.getMetadata('method', prototype[method]));

          if (path !== undefined && requestMethod !== undefined) {
            // Get method-level guards using the descriptor
            const methodGuards = Reflect.getMetadata(GUARDS_METADATA, prototype[method]) || [];

            const routePath = `${prefix}/${path}`.replace(/\/+/g, '/');

            // Combine controller and method guards
            const allGuards = [...controllerGuards, ...methodGuards];

            // Check if any guard extends JwtAuthGuard
            const hasJwtGuard = this.hasJwtAuthGuard(allGuards);

            if (!hasJwtGuard) {
              this.unprotectedRoutes.push(`${requestMethod} ${routePath}`);
            }
          }
        }
      }

      if (this.unprotectedRoutes.length > 0) {
        console.error(
          '\x1b[31m%s\x1b[0m',
          'ERROR: The following routes are not protected by AbilityGuard or its descendants:'
        );
        this.unprotectedRoutes.forEach((route) => console.error('\x1b[31m%s\x1b[0m', `- ${route}`));
        //process.exit(1);
        return;
      }

      console.log('✅ All routes are protected by AbilityGuard or its descendants');
    } catch (error) {
      console.error('Error during validation:', error);
      process.exit(1);
    }
  }

  private hasJwtAuthGuard(guards: Type<any>[]): boolean {
    if (!guards || guards.length === 0) return false;

    return guards.some((guard) => {
      try {
        // Check if the guard is JwtAuthGuard itself
        if (guard === AbilityGuard) return true;

        // Get the prototype chain of the guard
        let currentPrototype = guard.prototype;
        while (currentPrototype) {
          const constructor = currentPrototype.constructor;

          // Check if the current constructor is JwtAuthGuard
          if (constructor === AbilityGuard) {
            return true;
          }

          // Move up the prototype chain
          currentPrototype = Object.getPrototypeOf(currentPrototype);

          // Break if we've reached the end of the chain
          if (!currentPrototype || currentPrototype === Object.prototype) {
            break;
          }
        }

        return false;
      } catch (error) {
        console.error('Error checking guard:', guard);
        return false;
      }
    });
  }

  private getRequestMethodName(method: number): string {
    const methodMap = {
      0: 'GET',
      1: 'POST',
      2: 'PUT',
      3: 'DELETE',
      4: 'PATCH',
      5: 'ALL',
      6: 'OPTIONS',
      7: 'HEAD',
      8: 'SEARCH',
    };
    return methodMap[method] || 'UNKNOWN';
  }
}

// Create a module to provide the validator
import { Module } from '@nestjs/common';

@Module({
  providers: [GuardValidator, MetadataScanner],
  exports: [GuardValidator],
})
export class GuardValidatorModule {}
