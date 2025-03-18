export interface Article {
  id: number;
  company: string;
  app: string;
  title: string;
  description: string;
  category: string;
  content: string;
  publishDate: string; // O Date, según cómo manejes las fechas
  promoteVideo: boolean;
  approved: boolean;
  headerImage?: string;
}
