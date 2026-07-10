import type {
  CreateWalletCommand,
  SetWalletActiveCommand,
  UpdateWalletCommand,
} from "../commands/wallet-commands";
import type {
  CreateWalletRequest,
  SetWalletActiveRequest,
  UpdateWalletRequest,
} from "../schemas/wallet-schema";

export function createWalletRequestToCommand(
  request: CreateWalletRequest,
): CreateWalletCommand {
  return {
    name: request.name,
    type: request.type,
    initialBalanceCents: request.initialBalanceCents,
    active: request.active,
  };
}

export function updateWalletRequestToCommand(
  request: UpdateWalletRequest,
): UpdateWalletCommand {
  return {
    id: request.id,
    name: request.name,
    type: request.type,
    initialBalanceCents: request.initialBalanceCents,
    active: request.active,
  };
}

export function setWalletActiveRequestToCommand(
  request: SetWalletActiveRequest,
): SetWalletActiveCommand {
  return {
    id: request.id,
  };
}
