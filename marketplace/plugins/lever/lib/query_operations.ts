import { QueryOptions, Operation } from './types';

export interface LeverRequest {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  searchParams: Record<string, string | number | boolean>;
  json?: Record<string, unknown>;
}

/** Query-editor fields arrive as strings; an empty box must stay unset rather than "" or 0. */
const asNumber = (value: number | string | undefined): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const asBoolean = (value: boolean | string | undefined): boolean | undefined => {
  if (value === undefined || value === '') return undefined;
  return value === true || value === 'true' || value === '{{true}}';
};

const asString = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** Comma-separated editor input into the arrays Lever expects. */
const splitList = (value: string | undefined): string[] | undefined => {
  const entries = (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length ? entries : undefined;
};

/** Lever treats the "any" choice as no filter; the dropdown needs a non-empty value to offer it. */
const asFilter = (value: string | undefined): string | undefined => {
  const trimmed = asString(value);
  return trimmed && trimmed !== 'any' ? trimmed : undefined;
};

const parseJson = (value: string | undefined, field: string): unknown => {
  const trimmed = asString(value);
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`Invalid JSON in ${field}`);
  }
};

const pickSet = (entries: Record<string, string | number | boolean | undefined>): Record<string, string | number | boolean> =>
  Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined)) as Record<
    string,
    string | number | boolean
  >;

const pickSetJson = (entries: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined));

/** Lever's posting content object, built from the individual fields so nobody has to hand-write JSON. */
function buildPostingBody(options: QueryOptions): Record<string, unknown> {
  const categories = pickSetJson({
    team: asString(options.category_team),
    location: asString(options.category_location),
    department: asString(options.category_department),
    commitment: asString(options.category_commitment),
  });
  const content = pickSetJson({
    description: asString(options.description_html),
    descriptionPlain: asString(options.description_plain),
    lists: parseJson(options.lists_json, 'Lists (JSON)'),
    additional: asString(options.additional_html),
    additionalPlain: asString(options.additional_plain),
  });
  return pickSetJson({
    text: asString(options.text),
    state: asFilter(options.state),
    tags: splitList(options.tags),
    workplaceType: asFilter(options.workplace_type),
    requisitionCodes: splitList(options.requisition_codes),
    ...(Object.keys(categories).length ? { categories } : {}),
    ...(Object.keys(content).length ? { content } : {}),
  });
}

const pagination = (options: QueryOptions) => ({
  limit: asNumber(options.limit),
  offset: asNumber(options.offset),
});

const performAs = (options: QueryOptions) => ({ perform_as: asString(options.perform_as) });

export function buildRequest(operation: Operation, options: QueryOptions): LeverRequest {
  const id = asString(options.opportunity_id);
  const postingId = asString(options.posting_id);

  switch (operation) {
    case Operation.ListOpportunities:
      return {
        method: 'get',
        path: 'opportunities',
        searchParams: pickSet({
          stage_id: asString(options.stage_id),
          posting_id: asString(options.posting_id),
          tag: asString(options.tag),
          archived: asFilter(options.archived),
          archive_reason_id: asString(options.archive_reason_id),
          email: asString(options.email),
          ...pagination(options),
        }),
      };

    case Operation.GetOpportunity:
      return { method: 'get', path: `opportunities/${id}`, searchParams: {} };

    case Operation.CreateOpportunity:
      return {
        method: 'post',
        path: 'opportunities',
        searchParams: pickSet(performAs(options)),
        json: pickSetJson({
          name: asString(options.name),
          headline: asString(options.headline),
          location: asString(options.location),
          stage: asString(options.stage_id),
          origin: asString(options.origin),
          owner: asString(options.owner),
          emails: splitList(options.emails),
          phones: splitList(options.phones),
          links: splitList(options.links),
          tags: splitList(options.tags),
          sources: splitList(options.sources),
          postings: splitList(options.postings),
        }),
      };

    case Operation.UpdateOpportunityStage:
      return {
        method: 'put',
        path: `opportunities/${id}/stage`,
        searchParams: pickSet(performAs(options)),
        json: { stage: asString(options.stage_id) },
      };

    case Operation.ArchiveOpportunity:
      return {
        method: 'put',
        path: `opportunities/${id}/archived`,
        searchParams: pickSet(performAs(options)),
        json: pickSetJson({
          reason: asString(options.archive_reason_id),
          cleanInterviews: asBoolean(options.clean_interviews),
        }),
      };

    case Operation.UnarchiveOpportunity:
      return {
        method: 'put',
        path: `opportunities/${id}/archived`,
        searchParams: pickSet(performAs(options)),
        json: { reason: null },
      };

    case Operation.AddOpportunityTags:
      return {
        method: 'post',
        path: `opportunities/${id}/addTags`,
        searchParams: pickSet(performAs(options)),
        json: { tags: splitList(options.tags) ?? [] },
      };

    case Operation.AddOpportunityNote:
      return {
        method: 'post',
        path: `opportunities/${id}/notes`,
        searchParams: pickSet(performAs(options)),
        json: { value: asString(options.note) },
      };

    case Operation.ListPostings:
      return {
        method: 'get',
        path: 'postings',
        searchParams: pickSet({
          state: asFilter(options.state),
          confidentiality: asFilter(options.confidentiality),
          ...pagination(options),
        }),
      };

    case Operation.GetPosting:
      return {
        method: 'get',
        path: `postings/${postingId}`,
        searchParams: pickSet({ distribution: asFilter(options.distribution) }),
      };

    case Operation.CreatePosting:
      return {
        method: 'post',
        path: 'postings',
        searchParams: pickSet(performAs(options)),
        json: buildPostingBody(options),
      };

    case Operation.UpdatePosting:
      return {
        method: 'put',
        path: `postings/${postingId}`,
        searchParams: pickSet(performAs(options)),
        json: buildPostingBody(options),
      };

    case Operation.ListOpportunityInterviews:
      return { method: 'get', path: `opportunities/${id}/interviews`, searchParams: pickSet(pagination(options)) };

    case Operation.ListOpportunityFeedback:
      return { method: 'get', path: `opportunities/${id}/feedback`, searchParams: pickSet(pagination(options)) };

    case Operation.ListOpportunityOffers:
      return { method: 'get', path: `opportunities/${id}/offers`, searchParams: pickSet(pagination(options)) };

    case Operation.ListStages:
      return { method: 'get', path: 'stages', searchParams: {} };

    case Operation.ListArchiveReasons:
      return { method: 'get', path: 'archive_reasons', searchParams: pickSet({ type: asFilter(options.type) }) };

    case Operation.ListUsers:
      return { method: 'get', path: 'users', searchParams: pickSet(pagination(options)) };

    case Operation.ListRequisitions:
      return {
        method: 'get',
        path: 'requisitions',
        searchParams: pickSet({
          status: asString(options.status),
          requisition_code: asString(options.requisition_code),
          confidentiality: asFilter(options.confidentiality),
          ...pagination(options),
        }),
      };

    default:
      throw new Error('Invalid operation');
  }
}
