import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Info, RotateCcw, Sparkles, X } from 'lucide-react';
import { populationCalculator } from './calculator/populationCalculator';
import { populationModel } from './data/model';
import type { PopulationFilters, Sex } from './types/population';

type Key = keyof PopulationFilters;
type Criterion = { id:string; label:string; keys:Key[]; type:'range'|'select'; options?:[string,string][]; unit?:string; placeholders?:[string,string] };
const criteria: Criterion[] = [
 {id:'income',label:'Доход',keys:['incomeMin','incomeMax'],type:'range',unit:'₽ / мес.',placeholders:['от 0','до 500 000']},
 {id:'marital',label:'Семейное положение',keys:['maritalStatus'],type:'select',options:[['single','Не состоит в браке'],['married','Состоит в браке'],['divorced','Разведён / разведена'],['widowed','Вдовец / вдова']]},
 {id:'children',label:'Дети',keys:['children'],type:'select',options:[['0','Нет детей'],['1','1 ребёнок'],['2','2 ребёнка'],['3_plus','3+ детей']]},
 {id:'education',label:'Образование',keys:['education'],type:'select',options:[['secondary_or_less','Среднее или ниже'],['vocational','Среднее профессиональное'],['higher','Высшее']]},
 {id:'height',label:'Рост',keys:['heightMin','heightMax'],type:'range',unit:'см',placeholders:['от 140','до 210']},
 {id:'weight',label:'Вес',keys:['weightMin','weightMax'],type:'range',unit:'кг',placeholders:['от 40','до 150']},
 {id:'hair',label:'Цвет волос',keys:['hairColor'],type:'select',options:[['blonde','Светлые'],['light_brown','Русые'],['brown','Каштановые'],['dark','Тёмные'],['red','Рыжие'],['other','Другое']]},
 {id:'eyes',label:'Цвет глаз',keys:['eyeColor'],type:'select',options:[['blue','Голубые'],['gray','Серые'],['green','Зелёные'],['brown','Карие'],['hazel_other','Другие']]},
 {id:'property',label:'Недвижимость',keys:['property'],type:'select',options:[['owns_housing','Есть собственное жильё'],['does_not_own_housing','Нет собственного жилья']]},
 {id:'smoking',label:'Курение',keys:['smoking'],type:'select',options:[['non_smoker','Не курит'],['smoker','Курит'],['former_smoker','Бывший курильщик']]},
 {id:'alcohol',label:'Алкоголь',keys:['alcohol'],type:'select',options:[['none_or_rare','Не употребляет / крайне редко'],['occasional','Иногда'],['regular','Регулярно'],['frequent','Часто']]},
 {id:'employment',label:'Занятость',keys:['employmentStatus'],type:'select',options:[['employee','Работает по найму'],['entrepreneur','Предприниматель'],['student','Студент'],['retired','Пенсионер'],['unemployed','Безработный'],['other_not_working','Другое / не работает']]},
];
const compact = (n:number) => n === 0 ? '0 человек' : `${new Intl.NumberFormat('ru-RU',{notation:'compact',maximumSignificantDigits:2}).format(n)} человек`;
const percent = (n:number) => n === 0 ? '0%' : n < .0001 ? '< 0,01%' : new Intl.NumberFormat('ru-RU',{style:'percent',maximumFractionDigits:2}).format(n);
const rarity = (n:number|null) => n ? `1 из ${new Intl.NumberFormat('ru-RU',{maximumSignificantDigits:2}).format(n)}` : 'реже 1 из 100 млн';

export default function App(){
 const [filters,setFilters] = useState<PopulationFilters>({sex:'female',ageMin:25,ageMax:40});
 const [active,setActive] = useState<string[]>([]);
 const result=useMemo(()=>populationCalculator(filters),[filters]);
 const set=(key:Key,value:string|number|undefined)=>setFilters(f=>({...f,[key]:value}));
 const remove=(c:Criterion)=>{setActive(a=>a.filter(x=>x!==c.id));setFilters(f=>{const n={...f};c.keys.forEach(k=>delete n[k]);return n})};
 const reset=()=>{setFilters({sex:'female',ageMin:25,ageMax:40});setActive([])};
 return <main>
  <header><div className="brand"><span className="brand-mark">К</span><span>Круг поиска</span></div><span className="model">Модель РФ · {populationModel.reference_year}</span></header>
  <section className="hero"><div className="eyebrow"><Sparkles size={14}/> Designed by Valentin Chernyak</div><h1>Сколько людей подходят<br/>под ваши критерии?</h1><p>Оцените распространённость заданного профиля среди<br className="desktop"/> взрослого населения России.</p></section>
  <div className="layout">
   <section className="card form-card"><div className="section-title"><span>01</span><div><h2>Кого ищем?</h2><p>Задайте основные параметры</p></div></div>
    <label>Пол</label><div className="segment">{([['female','Женщину'],['male','Мужчину']] as [Sex,string][]).map(([v,l])=><button className={filters.sex===v?'selected':''} onClick={()=>set('sex',v)} key={v}>{l}</button>)}</div>
    <label>Возраст</label><div className="age-row"><div><small>ОТ</small><input aria-label="Возраст от" type="number" min="18" max="90" value={filters.ageMin} onChange={e=>set('ageMin',+e.target.value)}/></div><span>—</span><div><small>ДО</small><input aria-label="Возраст до" type="number" min="18" max="90" value={filters.ageMax} onChange={e=>set('ageMax',+e.target.value)}/></div><b>лет</b></div>
    <div className="divider"/><div className="section-title"><span>02</span><div><h2>Дополнительные критерии</h2><p>Добавьте только то, что важно</p></div></div>
    <div className="chips">{criteria.map(c=><button key={c.id} className={active.includes(c.id)?'chip active':'chip'} onClick={()=>active.includes(c.id)?remove(c):setActive(a=>[...a,c.id])}>{active.includes(c.id)?<X size={14}/>:<span>＋</span>}{c.label}</button>)}</div>
    <div className="active-filters">{criteria.filter(c=>active.includes(c.id)).map(c=><div className="filter" key={c.id}><div className="filter-head"><label>{c.label}</label><button aria-label={`Удалить ${c.label}`} onClick={()=>remove(c)}><X size={16}/></button></div>{c.type==='select'?<div className="select-wrap"><select value={(filters[c.keys[0]] as string)||''} onChange={e=>set(c.keys[0],e.target.value||undefined)}><option value="">Выберите значение</option>{c.options?.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select><ChevronDown size={16}/></div>:<div className="range"><input type="number" placeholder={c.placeholders?.[0]} value={(filters[c.keys[0]] as number)??''} onChange={e=>set(c.keys[0],e.target.value===''?undefined:+e.target.value)}/><span>—</span><input type="number" placeholder={c.placeholders?.[1]} value={(filters[c.keys[1]] as number)??''} onChange={e=>set(c.keys[1],e.target.value===''?undefined:+e.target.value)}/><b>{c.unit}</b></div>}</div>)}</div>
    <button className="reset" onClick={reset}><RotateCcw size={15}/> Сбросить фильтры</button>
   </section>
   <aside className="result"><div className="result-top"><div className="live"><i/> Результат обновляется</div><span className={`confidence ${result.confidence}`}>Точность: {result.confidence==='high'?'высокая':result.confidence==='medium'?'средняя':'ориентировочная'}</span></div><p>По заданным критериям подходит</p><h2>≈ {compact(result.estimatedCount)}</h2><div className="rule"/>
    <div className="metrics"><div><small>СРЕДИ ВСЕХ ВЗРОСЛЫХ</small><strong>≈ {percent(result.shareOfAdults)}</strong><span>населения России 18+</span></div><div><small>СРЕДИ {filters.sex==='female'?'ЖЕНЩИН':'МУЖЧИН'}</small><strong>≈ {percent(result.shareOfSelectedSex)}</strong><span>{filters.sex==='female'?'женщин':'мужчин'} 18+</span></div><div className="rare"><small>РЕДКОСТЬ ПРОФИЛЯ</small><strong>{rarity(result.rarity)}</strong><span>среди выбранного пола</span></div></div>
    <details><summary><Info size={16}/> Как это рассчитано? <ArrowRight size={15}/></summary><p>{result.methodology}</p></details>
   </aside>
  </div>
  <footer><Info size={18}/><p><strong>Важно понимать</strong>Расчёт является статистической и модельной оценкой. Он показывает распространённость заданного профиля среди взрослого населения России, а не вероятность встретить такого человека в реальной жизни. Часть характеристик основана на модельной оценке.</p></footer>
 </main>
}
