export type ArticleStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';

export interface Article {
  id: number;
  company: string;
  app: string;
  title: string;
  description: string;
  category: string;
  content: string;
  publishDate: string;
  promoteVideo: boolean;
  status: ArticleStatus; // ← ¡nuevo!
  headerImage?: string;
  headerImagePublicId?: string;
  headerImageUploadDate?: string;
}
