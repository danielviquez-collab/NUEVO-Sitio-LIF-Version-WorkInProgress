import type { MetadataRoute } from 'next';
// Node also imports this file when verifying the static export.
import { confessionStories } from '../lib/confession-stories.ts';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', 'recetario/', 'confesiones/', 'confesiones/todas/', 'juega/', 'sabores/', ...confessionStories.map(({slug}) => `confesiones/${slug}/`)];
  return routes.map((path) => ({ url: `https://lif.cr/${path}`, changeFrequency: path ? 'monthly' : 'weekly', priority: path ? 0.7 : 1 }));
}
