export type SourceOptions = {
  apiKey: string;
  /** "production" (https://api.lever.co/v1) or "sandbox" (https://api.sandbox.lever.co/v1). */
  environment?: string;
};

export type QueryOptions = {
  operation: Operation;
  /** Shared identifiers. */
  opportunity_id?: string;
  posting_id?: string;
  perform_as?: string;
  /** List filters. */
  stage_id?: string;
  tag?: string;
  archived?: string;
  archive_reason_id?: string;
  email?: string;
  state?: string;
  confidentiality?: string;
  type?: string;
  status?: string;
  requisition_code?: string;
  distribution?: string;
  limit?: number | string;
  offset?: number | string;
  /** Create opportunity. */
  name?: string;
  headline?: string;
  emails?: string;
  phones?: string;
  links?: string;
  tags?: string;
  sources?: string;
  origin?: string;
  owner?: string;
  location?: string;
  postings?: string;
  /** Notes. */
  note?: string;
  /** Posting writes. */
  text?: string;
  workplace_type?: string;
  requisition_codes?: string;
  category_team?: string;
  category_location?: string;
  category_department?: string;
  category_commitment?: string;
  description_html?: string;
  description_plain?: string;
  lists_json?: string;
  additional_html?: string;
  additional_plain?: string;
  /** Archive. */
  clean_interviews?: boolean | string;
};

export enum Operation {
  ListOpportunities = 'list_opportunities',
  GetOpportunity = 'get_opportunity',
  CreateOpportunity = 'create_opportunity',
  UpdateOpportunityStage = 'update_opportunity_stage',
  ArchiveOpportunity = 'archive_opportunity',
  UnarchiveOpportunity = 'unarchive_opportunity',
  AddOpportunityTags = 'add_opportunity_tags',
  AddOpportunityNote = 'add_opportunity_note',
  ListPostings = 'list_postings',
  GetPosting = 'get_posting',
  CreatePosting = 'create_posting',
  UpdatePosting = 'update_posting',
  ListOpportunityInterviews = 'list_opportunity_interviews',
  ListOpportunityFeedback = 'list_opportunity_feedback',
  ListOpportunityOffers = 'list_opportunity_offers',
  ListStages = 'list_stages',
  ListArchiveReasons = 'list_archive_reasons',
  ListUsers = 'list_users',
  ListRequisitions = 'list_requisitions',
}
