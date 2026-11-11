import { Request, Response } from 'express';

interface Pagination {
  page: number;
  perPage: number;
  totalCount: number;
}

// Builds the RFC 8288 Link value for a paginated list, keeping the caller's other query parameters.
export const buildPaginationLink = (
  path: string,
  query: Record<string, unknown>,
  { page, perPage, totalCount }: Pagination
): string => {
  const lastPage = Math.max(1, Math.ceil(totalCount / perPage));
  const pageUrl = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') params.set(key, value);
    }
    params.set('page', String(target));
    params.set('per_page', String(perPage));
    return `<${path}?${params.toString()}>`;
  };

  const links: string[] = [];
  if (page < lastPage) links.push(`${pageUrl(page + 1)}; rel="next"`);
  if (page > 1) links.push(`${pageUrl(Math.min(page - 1, lastPage))}; rel="prev"`);
  return links.join(', ');
};

// v2 list responses also carry their pagination as headers: X-Total-Count and Link.
export const setPaginationHeaders = (request: Request, response: Response, pagination: Pagination): void => {
  response.setHeader('X-Total-Count', String(pagination.totalCount));
  const link = buildPaginationLink(request.originalUrl.split('?')[0], request.query, pagination);
  if (link) response.setHeader('Link', link);
};
