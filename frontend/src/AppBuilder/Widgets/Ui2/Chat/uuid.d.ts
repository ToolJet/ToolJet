// uuid ships no types and @types/uuid is not installed: the part of its API the pack uses.
declare module 'uuid' {
  export function v4(): string;
}
