import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Residence = {
  id: number;
  nom: string;
  ville: string | null;
  region: string | null;
  mrc: string | null;
  categorie: string | null;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  site_web: string | null;
  latitude: number | null;
  longitude: number | null;
  note_google: number | null;
  nb_avis_google: number | null;
  photo_url: string | null;
  nb_unites: number | null;
  statut: string | null;
  prix_min: number | null;
  prix_max: number | null;
  description: string | null;
  langue_service: string | null;
  fiche_reclamee: boolean;
  tier: string | null;
  quality_score: number | null;
};
