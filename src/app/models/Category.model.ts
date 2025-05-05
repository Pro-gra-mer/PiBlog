export interface Category {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  emoji?: string;
  headerImage?: string; // puede ser URL o nombre del archivo
  createdAt?: string;
}
