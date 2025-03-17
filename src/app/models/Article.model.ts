export interface Article {
  id: number;
  company: string;
  app: string;
  title: string;
  category: string;
  content: string;
  publishDate: string; // O Date, según cómo manejes las fechas
  promoteVideo: boolean;
  approved: boolean;
}
