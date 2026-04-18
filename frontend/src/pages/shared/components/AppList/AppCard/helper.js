import { validateName } from '@/_helpers/utils';

export const isValidSlug = (slug) => {
  const validate = validateName(slug, 'slug', true, false, false, false);
  return validate.status;
};
