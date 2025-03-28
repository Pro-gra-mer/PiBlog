import { Category } from './Category.model';

export type ArticleStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';

export interface Article {
  id: number;
  company: string;
  app: string;
  title: string;
  description: string;
  category: Category;
  content: string;
  publishDate: string;
  promoteVideo: boolean;
  status: ArticleStatus;

  // Header image
  headerImage?: string;
  headerImagePublicId?: string;
  headerImageUploadDate?: string;

  // ✅ Video promo
  promoVideo?: string;
  promoVideoPublicId?: string;
  promoVideoUploadDate?: string;
}
