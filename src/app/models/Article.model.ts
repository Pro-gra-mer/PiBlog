import { Category } from './Category.model';

export type ArticleStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'REJECTED';

export type PromoteType = 'NONE' | 'CATEGORY' | 'MAIN';

export interface Article {
  id: number;
  company: string;
  app: string;
  title: string;
  description: string;
  category: Category;
  content: string;
  publishDate: string;
  promoteType: PromoteType;
  status: ArticleStatus;
  rejectionReason: string;

  // Header image
  headerImage?: string;
  headerImagePublicId?: string;
  headerImageUploadDate?: string;

  // ✅ Video promo
  promoVideo?: string;
  promoVideoPublicId?: string;
  promoVideoUploadDate?: string;
}
