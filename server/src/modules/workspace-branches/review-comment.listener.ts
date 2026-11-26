import { Injectable } from '@nestjs/common';

// No-op in CE: git branch reviews are an EE feature.
@Injectable()
export class ReviewCommentListener {}
