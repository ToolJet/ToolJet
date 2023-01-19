import { AppAbility } from '../casl/casl-ability.factory';
import { TooljetDbAbility } from './abilities/tooljet-db-ability.factory';

interface IPolicyHandler {
  handle(ability: AppAbility | TooljetDbAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility | TooljetDbAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
