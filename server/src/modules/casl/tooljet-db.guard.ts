import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TooljetDbAbility, TooljetDbAbilityFactory } from './abilities/tooljet-db-ability.factory';
import { CHECK_POLICIES_KEY } from './check_policies.decorator';
import { PolicyHandler } from './policyhandler.interface';

@Injectable()
export class TooljetDbGuard implements CanActivate {
  constructor(private reflector: Reflector, private tooljetDbAbilityFactory: TooljetDbAbilityFactory) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers = this.reflector.get<PolicyHandler[]>(CHECK_POLICIES_KEY, context.getHandler()) || [];

    const { user, params } = context.switchToHttp().getRequest();

    const ability = await this.tooljetDbAbilityFactory.actions(user, params);

    return policyHandlers.every((handler) => this.execPolicyHandler(handler, ability));
  }

  private execPolicyHandler(handler: PolicyHandler, ability: TooljetDbAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
