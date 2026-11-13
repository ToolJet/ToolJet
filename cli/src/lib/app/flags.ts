import { Flags } from '@oclif/core';

export const targetFlags = {
  url: Flags.string({ description: 'ToolJet API origin (else TOOLJET_URL, else the stored login)' }),
  token: Flags.string({ description: 'Personal access token (else TOOLJET_PAT, else the stored login)' }),
  instance: Flags.string({
    description:
      "Use this instance's stored login, even in a project that belongs to another (a project uses its own instance's login by default)",
  }),
};
