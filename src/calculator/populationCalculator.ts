import { populationModel as defaultModel } from '../data/model';
import type { CalculationResult, PopulationFilters, PopulationModel, Sex } from '../types/population';

const SQRT2 = Math.sqrt(2);
const erf = (x: number) => {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-a * a);
  return sign * y;
};
const normalCdf = (x: number, mean: number, sd: number) => (1 + erf((x - mean) / (sd * SQRT2))) / 2;
const normalRange = (min: number | undefined, max: number | undefined, mean: number, sd: number) =>
  Math.max(0, normalCdf(max ?? Infinity, mean, sd) - normalCdf(min ?? -Infinity, mean, sd));

const rangeKey = (record: Record<string, unknown>, age: number) => Object.keys(record).find(key => {
  const [start, end] = key.split('_').map(Number);
  return age >= start && age <= end;
});

const bandForAge = (model: PopulationModel, age: number) => model.age_bands.find(b => age >= b.min && age <= b.max)!;

function probabilityForYear(model: PopulationModel, sex: Sex, age: number, filters: PopulationFilters): number {
  const d = model.distributions;
  const band = bandForAge(model, age).id;
  let p = 1;
  for (const [filter, distribution] of [
    ['maritalStatus', 'marital_status'], ['children', 'children'], ['education', 'education'],
  ] as const) {
    const value = filters[filter];
    if (value) p *= d[distribution][sex][band][value] ?? 0;
  }
  for (const [filter, distribution] of [
    ['employmentStatus', 'employment_status'], ['smoking', 'smoking'], ['alcohol', 'alcohol'],
  ] as const) {
    const value = filters[filter];
    if (value) {
      const record = d[distribution][sex];
      const key = rangeKey(record, age);
      p *= key ? (record[key][value] ?? 0) : 0;
    }
  }
  if (filters.hairColor) p *= d.hair_color[sex][filters.hairColor] ?? 0;
  if (filters.eyeColor) p *= d.eye_color[sex][filters.eyeColor] ?? 0;
  if (filters.property) {
    const record = d.property[sex];
    const key = rangeKey(record, age);
    const owns = key ? record[key] : 0;
    p *= filters.property === 'owns_housing' ? owns : 1 - owns;
  }
  if (filters.incomeMin !== undefined || filters.incomeMax !== undefined) {
    const { median, p90 } = d.income_monthly_rub[sex][band];
    const sigma = Math.log(p90 / median) / 1.281551565545;
    const cdf = (value: number) => value <= 0 ? 0 : normalCdf(Math.log(value), Math.log(median), sigma);
    p *= Math.max(0, cdf(filters.incomeMax ?? Infinity) - cdf(filters.incomeMin ?? 0));
  }
  const height = d.height_cm[sex];
  const adjustmentKey = rangeKey(height.age_adjustment, age)!;
  const heightMean = height.mean + height.age_adjustment[adjustmentKey];
  if (filters.heightMin !== undefined || filters.heightMax !== undefined)
    p *= normalRange(filters.heightMin, filters.heightMax, heightMean, height.sd);
  if (filters.weightMin !== undefined || filters.weightMax !== undefined) {
    const bmi = d.weight_kg[sex];
    const bmiKey = rangeKey(bmi.bmi_mean, age)!;
    const heightM = heightMean / 100;
    p *= normalRange(filters.weightMin, filters.weightMax, bmi.bmi_mean[bmiKey] * heightM ** 2, bmi.bmi_sd * heightM ** 2);
  }
  return p;
}

export function populationCalculator(filters: PopulationFilters, model: PopulationModel = defaultModel): CalculationResult {
  const min = filters.ageMin ?? 18;
  const max = filters.ageMax ?? 90;
  const sexes: Sex[] = filters.sex ? [filters.sex] : ['male', 'female'];
  const invalid = min < 18 || max > 90 || min > max ||
    (filters.incomeMin !== undefined && filters.incomeMax !== undefined && filters.incomeMin > filters.incomeMax) ||
    (filters.heightMin !== undefined && filters.heightMax !== undefined && filters.heightMin > filters.heightMax) ||
    (filters.weightMin !== undefined && filters.weightMax !== undefined && filters.weightMin > filters.weightMax);
  let estimated = 0;
  if (!invalid) for (const sex of sexes) for (let age = min; age <= max; age++) {
    const band = bandForAge(model, age);
    const peopleInYear = model.base_population * model.sex_share[sex] * model.age_distribution[sex][band.id] / (band.max - band.min + 1);
    estimated += peopleInYear * probabilityForYear(model, sex, age, filters);
  }
  const estimatedCount = Math.max(0, Math.round(estimated));
  const relevant = filters.sex ? model.base_population * model.sex_share[filters.sex] : model.base_population;
  const physical = filters.heightMin !== undefined || filters.heightMax !== undefined || filters.weightMin !== undefined || filters.weightMax !== undefined || !!filters.hairColor || !!filters.eyeColor;
  const additional = Object.entries(filters).filter(([key, value]) => !['sex', 'ageMin', 'ageMax'].includes(key) && value !== undefined).length;
  return {
    estimatedCount,
    shareOfAdults: estimatedCount / model.base_population,
    shareOfSelectedSex: estimatedCount / relevant,
    rarity: estimatedCount ? Math.max(1, Math.round(relevant / estimatedCount)) : null,
    confidence: physical || additional >= 4 ? 'low' : additional ? 'medium' : 'high',
    methodology: 'Расчёт суммирует годовые возрастные группы и использует условные распределения по полу и возрасту из модели. Доход аппроксимирован логнормальным распределением, рост — нормальным, вес — через BMI и средний рост. Когда совместных распределений в файле нет, признаки считаются условно независимыми внутри пола и возраста; поэтому сочетания множества признаков менее точны.',
  };
}
