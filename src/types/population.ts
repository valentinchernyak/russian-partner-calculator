export type Sex = 'male' | 'female';
export interface PopulationFilters {
  sex?: Sex; ageMin?: number; ageMax?: number;
  incomeMin?: number; incomeMax?: number; maritalStatus?: string; children?: string;
  education?: string; heightMin?: number; heightMax?: number; weightMin?: number;
  weightMax?: number; hairColor?: string; eyeColor?: string; property?: string;
  smoking?: string; alcohol?: string; employmentStatus?: string;
}
export interface CalculationResult {
  estimatedCount: number; shareOfAdults: number; shareOfSelectedSex: number;
  rarity: number | null; confidence: 'high' | 'medium' | 'low'; methodology: string;
}
export interface AgeBand { id: string; min: number; max: number }
export interface PopulationModel {
  model_version: string; reference_year: number; base_population: number; sex_share: Record<Sex, number>;
  age_bands: AgeBand[]; age_distribution: Record<Sex, Record<string, number>>;
  distributions: Record<string, any>; quality_labels: Record<string,string>;
}
