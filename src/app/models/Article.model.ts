import { Category } from './Category.model';
import { PromoteType } from './PromoteType';

export type ArticleStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'REJECTED';

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

  // Promo video
  promoVideo?: string;
  promoVideoPublicId?: string;
  promoVideoUploadDate?: string;

  planType?: string;
  expirationAt?: string; // o Date si prefieres formatearlo mejor

  // Nuevas propiedades para manejar múltiples planes
  activePlans?: Array<{
    planType: string;
    expirationAt: string;
    cancelled?: boolean;
  }>;
}
