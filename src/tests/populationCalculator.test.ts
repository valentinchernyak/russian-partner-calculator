import { describe, expect, it } from 'vitest';
import { populationCalculator } from '../calculator/populationCalculator';

describe('populationCalculator', () => {
 it('returns all adults without filters',()=>expect(populationCalculator({}).estimatedCount).toBe(100_000_000));
 it('handles only sex',()=>expect(populationCalculator({sex:'female'}).estimatedCount).toBe(54_000_000));
 it('narrows by sex and age',()=>expect(populationCalculator({sex:'male',ageMin:25,ageMax:34}).estimatedCount).toBeCloseTo(5_520_000,-1));
 it('combines several conditional criteria',()=>{const basic=populationCalculator({sex:'female',ageMin:30,ageMax:39});const filtered=populationCalculator({sex:'female',ageMin:30,ageMax:39,education:'higher',maritalStatus:'single',smoking:'non_smoker'});expect(filtered.estimatedCount).toBeGreaterThan(0);expect(filtered.estimatedCount).toBeLessThan(basic.estimatedCount)});
 it('returns zero for an impossible range',()=>expect(populationCalculator({ageMin:50,ageMax:30}).estimatedCount).toBe(0));
 it('supports model age boundaries',()=>{expect(populationCalculator({ageMin:18,ageMax:18}).estimatedCount).toBeGreaterThan(0);expect(populationCalculator({ageMin:90,ageMax:90}).estimatedCount).toBeGreaterThan(0)});
 it('supports income ranges',()=>{const low=populationCalculator({sex:'male',incomeMin:0,incomeMax:50_000});const high=populationCalculator({sex:'male',incomeMin:300_000});expect(low.estimatedCount).toBeGreaterThan(high.estimatedCount)});
 it('supports height and weight',()=>{const result=populationCalculator({sex:'female',heightMin:160,heightMax:170,weightMin:50,weightMax:75});expect(result.estimatedCount).toBeGreaterThan(0);expect(result.confidence).toBe('low')});
 it('returns zero for impossible continuous bounds',()=>expect(populationCalculator({heightMin:200,heightMax:150}).estimatedCount).toBe(0));
 it('handles a very rare combination',()=>{const result=populationCalculator({sex:'male',ageMin:18,ageMax:24,children:'3_plus',maritalStatus:'widowed',hairColor:'red'});expect(result.estimatedCount).toBe(0);expect(result.rarity).toBeNull()});
});
