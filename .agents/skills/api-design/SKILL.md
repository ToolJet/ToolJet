---
name: api-design
description: Enforce ToolJet API design standards for strict response DTOs, request validation, HTTP semantics, and data encapsulation. Use when writing, modifying, or reviewing NestJS controllers, services, or API endpoints.
---

# ToolJet API Design Standards

When writing or reviewing API code for ToolJet (NestJS controllers and services), you MUST adhere to the following standards to prevent data leakage, enforce strict API contracts, and ensure consistent HTTP semantics.

## 🚫 Forbidden Practices (Never Do These)

1. **Never return raw TypeORM entities in API responses:** Do not expose entities (like `OrganizationUser` or `User`) in DTOs or controller returns. They contain sensitive fields (e.g., `invitationToken`, `password_digest`).
2. **Never return anonymous inline objects:** Do not return `{ newPassword }` or untyped objects from controllers. Every endpoint must have a concrete Response DTO class.
3. **Never use `humps.decamelizeKeys()` on API responses:** Controllers must not blindly mutate object keys. Case mapping must be handled explicitly in the DTO using `class-transformer` (`@Expose({ name: '...' })`).
4. **No untyped Queries or Bodies:** Never use `@Query() query: any` and manual destructuring. Always map inputs to a Request/Query DTO to ensure validation (e.g., string vs number checks).
5. **No duplicated DTOs:** Never copy-paste DTOs across modules (e.g., `users/dto` vs `onboarding/dto`). Maintain a single source of truth for a wire shape.
6. **No over-fetching for side-effects:** Do not load full entities and relations into memory (e.g., via `findOneOrFail` with relations) just to extract a few fields for audit logging. Use `.select()` to narrow the query. If the same narrowed field-set is needed at more than one call site, don't repeat the `.select()` inline at each — add a named method to the module's Repository class (e.g. `getUserAuditFields(id)`), per the existing repository convention (`server/AGENTS.md` — "custom typed query methods, one per module"). One caller getting the field list wrong is a bug; every caller re-deriving it independently is a guarantee one eventually will.
7. **No `any` or `Promise<any>` for service/controller signatures:** Every parameter and return type must be a concrete DTO, entity, or primitive type. `any` disables the compiler on exactly the boundary this skill exists to protect.
8. **Never widen a nullable result to a non-nullable return type:** If the underlying query can return nothing (e.g. `repository.findOne()` typed `Promise<Entity | null>`), the method calling it must not claim `Promise<Entity>` and just return the value through — that's a lie the type checker won't catch here (`strict`/`strictNullChecks` is off in `server/tsconfig.json`, so nothing else will either). Either propagate the `| null`/`| undefined` explicitly so callers are forced to handle it, or throw at the point where "missing" is genuinely invalid — don't let it silently leak out as a false guarantee.
9. **`Pick`/`Omit` are not a response-filtering mechanism:** They're compile-time type views — erased at runtime. Typing a response as `Omit<User, 'password_digest'>` does not strip `password_digest` from the actual object handed to `res.json()`. Use them to shape request/update DTOs (see Required Pattern 7), never as a substitute for `@Exclude()` + `ClassSerializerInterceptor` on the response side.

## ✅ Required Patterns

### 1. Strict Response DTOs
Every endpoint must return a dedicated Response DTO. The DTO class must enforce `@Exclude()` so only fields explicitly opted-in with `@Expose()` are serialized.

```typescript
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose({ name: 'first_name' }) // Dictate casing here
  firstName: string;
}
```

### 2. Nested DTOs for Relations
Never nest an entity. Map related data to its own DTO using `@Type()`.

```typescript
import { Type } from 'class-transformer';

@Exclude()
export class OrganizationUserResponseDto {
  @Expose()
  role: string;
}

@Exclude()
export class UserResponseDto {
  @Expose({ name: 'organization_users' })
  @Type(() => OrganizationUserResponseDto)
  organizationUsers: OrganizationUserResponseDto[];
}
```

### 3. Serialize at the Edge
**CRITICAL:** `ClassSerializerInterceptor` is currently NOT registered globally in ToolJet — `@Exclude()` is inert unless a controller opts in. Add `@UseInterceptors(ClassSerializerInterceptor)` on the controller class itself, matching the existing pattern in `files/controller.ts` and `plugins/controller.ts` (CE and EE). Do not register it globally in `main.ts` — that affects every response in the app at once and needs its own dedicated review, not a side effect of one module's cleanup.

Return an actual instance of the Response DTO (via `plainToInstance`) from the handler; the controller-level interceptor strips everything not marked `@Expose()` on the way out.

```typescript
import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  async getUser(id: string): Promise<UserResponseDto> {
    const userEntity = await this.repository.findOne(id);
    return plainToInstance(UserResponseDto, userEntity);
  }
}
```

### 4. Correct HTTP Semantics for Edition-Gated CE Stubs
When creating Community Edition (CE) stubs for Enterprise Edition (EE) features, never throw `NotFoundException` (404) or plain `Error` (500). 
Throw `NotImplementedException` (501) or `ForbiddenException` (403).

### 5. Check Real Consumers Before Narrowing a Response
An endpoint that today returns a raw entity or an unstructured object may already have callers relying on a field you're about to drop by introducing a strict DTO. Before shrinking a response:
- Grep both `frontend/src` **and** `frontend/ee` for the field name(s) being removed — EE-only screens are a separate codebase and won't show up in a `frontend/src`-only search.
- If the endpoint lives under `server/src/modules/external-apis/` (or its `ee/` equivalent), treat it as ToolJet's **public API contract** — third-party integrators depend on it outside this repo. Removing or renaming a field there is a breaking change and needs its own deprecation path (e.g. keep the old field alongside the new one for a release), not a same-PR cleanup.
- Internal, frontend-only endpoints are lower risk but still need the grep — "nobody documented this field" isn't the same as "nobody uses it."

### 6. Update the Response-Shape Test
Per `server/docs/testing.md`, response shape is asserted with `toMatchObject()` in e2e tests, not per-field assertions. When an endpoint's response shape changes, add or update that assertion in the same PR — a shape change with no updated test is unverified.

### 7. Derive Request/Update DTOs, Don't Hand-Copy Them
Use `PickType`/`PartialType`/`OmitType` from `@nestjs/mapped-types` (already a dependency — see `data-queries/dto/index.ts`, `dto/comment.dto.ts`, `onboarding/dto/user.dto.ts:173`) to derive an update DTO from its base Create/Response DTO instead of retyping the same fields. Unlike raw TS `Partial`/`Pick`/`Omit`, these carry over the source class's `class-validator`/`class-transformer` decorators.

```typescript
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

## Checklist before generating/submitting API code:
- [ ] Are all `@Query()` and `@Body()` inputs backed by a validated DTO class?
- [ ] Does the endpoint return a Response DTO class?
- [ ] Does the Response DTO have `@Exclude()` at the class level?
- [ ] Are related entities mapped to nested DTOs (using `@Type()`)?
- [ ] Does the controller have `@UseInterceptors(ClassSerializerInterceptor)`, and does the handler return `plainToInstance(ResponseDto, data)`?
- [ ] Are CE stubs using 501/403 instead of 404/500?
- [ ] Did you grep `frontend/src` and `frontend/ee` (and, for `external-apis` endpoints, check for a deprecation path) for any field being dropped from the response?
- [ ] Is there an e2e test asserting the new response shape via `toMatchObject()`?
- [ ] Are all signatures free of `any`/`Promise<any>`, and does every nullable query result stay nullable in the calling method's return type?
- [ ] Is a request/update DTO derived via `PartialType`/`PickType`/`OmitType` rather than hand-copied?
