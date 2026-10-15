(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.KNanoBenchmarking=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

// External benchmark library for K-NanoMFA v2.3.0.
// Concentrations are converted to the units used by the K-NanoMFA output fields.
// A record is a comparison datum; study_id is used to prevent studies with multiple
// reported compartments from receiving disproportionate weight in summary statistics.
const library=[
  // Broad multi-material historical envelope retained for continuity with v2.2.0.
  {id:'gottschalk2009-sw',study_id:'Gottschalk2009',materials:['CNT','AgNP','nano-TiO2','nano-ZnO','Fullerenes'],metric:'surface_water_pec_ug_L',name:'Multi-material regional surface-water PEC envelope',min:0.000003,max:0.021,unit:'mg/m³',year:2008,geo_groups:['Europe','North America'],material_score:12,endpoint_score:25,boundary_score:7,evidence_type:'PMFA',source:'Gottschalk et al. (2009)',citation:'Environ. Sci. Technol. 43, 9216-9222',doi:'10.1021/es9015553',url:'https://doi.org/10.1021/es9015553',note:'Broad envelope spanning several ENMs and regions. Retained as historical context; it is not a material-specific target.'},
  {id:'gottschalk2009-eff',study_id:'Gottschalk2009',materials:['CNT','AgNP','nano-TiO2','nano-ZnO','Fullerenes'],metric:'wwtp_effluent_concentration_ug_L',name:'Multi-material WWTP-effluent concentration envelope',min:0.004,max:4,unit:'mg/m³',year:2008,geo_groups:['Europe','North America'],material_score:12,endpoint_score:25,boundary_score:7,evidence_type:'PMFA',source:'Gottschalk et al. (2009)',citation:'Environ. Sci. Technol. 43, 9216-9222',doi:'10.1021/es9015553',url:'https://doi.org/10.1021/es9015553',note:'Broad multi-material envelope. Use as order-of-magnitude context only.'},
  {id:'gottschalk2009-soilinc',study_id:'Gottschalk2009',materials:['CNT','AgNP','nano-TiO2','nano-ZnO','Fullerenes'],metric:'annual_soil_increment_ug_kg',name:'Multi-material annual sludge-treated-soil increment',min:0.001,max:89,unit:'µg/kg·y',year:2008,geo_groups:['Europe','North America'],material_score:12,endpoint_score:18,boundary_score:6,evidence_type:'PMFA',source:'Gottschalk et al. (2009)',citation:'Environ. Sci. Technol. 43, 9216-9222',doi:'10.1021/es9015553',url:'https://doi.org/10.1021/es9015553',note:'Published endpoint is sludge-treated soil; the K-NanoMFA soil receiving compartment can be broader.'},

  // Classic material-specific CNT exposure model.
  {id:'mueller2008-cnt-water',study_id:'Mueller2008',materials:['CNT'],metric:'surface_water_pec_ug_L',name:'CNT freshwater concentration',min:0.0005,max:0.0008,unit:'mg/m³',year:2007,geo_groups:['Europe'],material_score:30,endpoint_score:25,boundary_score:10,evidence_type:'screening_model',source:'Mueller & Nowack (2008)',citation:'Environ. Sci. Technol. 42, 4447-4453',doi:'10.1021/es7029637',url:'https://doi.org/10.1021/es7029637',note:'Early deterministic exposure model. Useful as an independent historical CNT benchmark but based on older market and release assumptions.'},

  // Denmark PMFA: material-specific outputs. Multiple records share one study_id.
  {id:'gottschalk2015-cb-water',study_id:'Gottschalk2015',materials:['Carbon black'],metric:'surface_water_pec_ug_L',name:'Carbon black freshwater concentration',min:0.1,max:6,target:0.5,unit:'mg/m³',year:2014,reference_countries:['DK'],geo_groups:['Europe'],material_score:30,endpoint_score:25,boundary_score:8,evidence_type:'PMFA_conservative',source:'Gottschalk et al. (2015)',citation:'Int. J. Environ. Res. Public Health 12, 5581-5602',doi:'10.3390/ijerph120505581',url:'https://doi.org/10.3390/ijerph120505581',note:'The study conservatively assumed that all released carbon black was nanosized; actual nanoparticulate CB concentrations can therefore be lower.'},
  {id:'gottschalk2015-zno-water',study_id:'Gottschalk2015',materials:['nano-ZnO'],metric:'surface_water_pec_ug_L',name:'Nano-ZnO freshwater concentration',min:0.00009,max:0.013,target:0.00045,unit:'mg/m³',year:2014,reference_countries:['DK'],geo_groups:['Europe'],material_score:30,endpoint_score:25,boundary_score:11,evidence_type:'PMFA',source:'Gottschalk et al. (2015)',citation:'Int. J. Environ. Res. Public Health 12, 5581-5602',doi:'10.3390/ijerph120505581',url:'https://doi.org/10.3390/ijerph120505581',note:'Material-specific Danish PMFA; transformation of ZnO during wastewater treatment was included.'},
  {id:'gottschalk2015-cnt-water',study_id:'Gottschalk2015',materials:['CNT'],metric:'surface_water_pec_ug_L',name:'CNT freshwater concentration',min:0.0000002,max:0.000015,target:0.000001,unit:'mg/m³',year:2014,reference_countries:['DK'],geo_groups:['Europe'],material_score:30,endpoint_score:25,boundary_score:11,evidence_type:'PMFA',source:'Gottschalk et al. (2015)',citation:'Int. J. Environ. Res. Public Health 12, 5581-5602',doi:'10.3390/ijerph120505581',url:'https://doi.org/10.3390/ijerph120505581',note:'CNT natural-water concentration is reported at pg/L levels.'},
  {id:'gottschalk2015-cnt-sediment',study_id:'Gottschalk2015',materials:['CNT'],metric:'active_sediment_pec_ug_kg',name:'CNT freshwater-sediment concentration',min:0.1,max:5.6,target:0.5,unit:'µg/kg dry',year:2014,reference_countries:['DK'],geo_groups:['Europe'],material_score:30,endpoint_score:21,boundary_score:10,evidence_type:'PMFA',source:'Gottschalk et al. (2015)',citation:'Int. J. Environ. Res. Public Health 12, 5581-5602',doi:'10.3390/ijerph120505581',url:'https://doi.org/10.3390/ijerph120505581',note:'Published freshwater sediment is compared with K-NanoMFA active sediment; sediment depth and residence-time definitions differ.'},
  {id:'gottschalk2015-cnt-soil',study_id:'Gottschalk2015',materials:['CNT'],metric:'soil_pec_ug_kg',name:'CNT sludge-treated-soil concentration',min:0.03,max:0.18,target:0.06,unit:'µg/kg dry',year:2014,reference_countries:['DK'],geo_groups:['Europe'],material_score:30,endpoint_score:18,boundary_score:9,evidence_type:'PMFA',source:'Gottschalk et al. (2015)',citation:'Int. J. Environ. Res. Public Health 12, 5581-5602',doi:'10.3390/ijerph120505581',url:'https://doi.org/10.3390/ijerph120505581',note:'Published endpoint is sludge-treated soil, not a generic national soil compartment.'},
  {id:'gottschalk2015-cnt-air',study_id:'Gottschalk2015',materials:['CNT'],metric:'air_pec_ng_m3',name:'CNT air concentration',min:0.022,max:0.091,target:0.042,unit:'ng/m³',year:2014,reference_countries:['DK'],geo_groups:['Europe'],material_score:30,endpoint_score:25,boundary_score:10,evidence_type:'PMFA',source:'Gottschalk et al. (2015)',citation:'Int. J. Environ. Res. Public Health 12, 5581-5602',doi:'10.3390/ijerph120505581',url:'https://doi.org/10.3390/ijerph120505581',note:'Regional outdoor-air PEC; atmospheric mixing assumptions differ from the K-NanoMFA screening denominator.'},
  {id:'gottschalk2015-tio2-water',study_id:'Gottschalk2015',materials:['nano-TiO2'],metric:'surface_water_pec_ug_L',name:'Photostable nano-TiO2 freshwater concentration',min:0.0006,max:0.1,target:0.003,unit:'mg/m³',year:2014,reference_countries:['DK'],geo_groups:['Europe'],material_score:27,endpoint_score:25,boundary_score:10,evidence_type:'PMFA',source:'Gottschalk et al. (2015)',citation:'Int. J. Environ. Res. Public Health 12, 5581-5602',doi:'10.3390/ijerph120505581',url:'https://doi.org/10.3390/ijerph120505581',note:'Photostable nano-TiO2 was modeled separately from photocatalytic nano-TiO2; generic K-NanoMFA TiO2 may combine uses.'},

  // Dynamic CNT PMFA in Switzerland.
  {id:'bornhoft2016-cnt-soil-2014',study_id:'Bornhoft2016',materials:['CNT'],metric:'soil_pec_ug_kg',name:'Dynamic CNT soil concentration (2014)',target:0.074,unit:'µg/kg dry',year:2014,reference_countries:['CH'],geo_groups:['Europe'],material_score:30,endpoint_score:23,boundary_score:13,evidence_type:'DPMFA',source:'Bornhöft et al. (2016)',citation:'Environ. Model. Softw. 76, 69-80',doi:'10.1016/j.envsoft.2015.11.012',url:'https://doi.org/10.1016/j.envsoft.2015.11.012',note:'Dynamic probabilistic CNT MFA for Switzerland; soil accumulation was calculated from time-varying stocks and flows.'},
  {id:'bornhoft2016-cnt-soil-2025',study_id:'Bornhoft2016',materials:['CNT'],metric:'soil_pec_ug_kg',name:'Dynamic CNT soil concentration (2025 growth scenario)',target:0.486,unit:'µg/kg dry',year:2025,reference_countries:['CH'],geo_groups:['Europe'],material_score:30,endpoint_score:23,boundary_score:13,evidence_type:'DPMFA',source:'Bornhöft et al. (2016)',citation:'Environ. Model. Softw. 76, 69-80',doi:'10.1016/j.envsoft.2015.11.012',url:'https://doi.org/10.1016/j.envsoft.2015.11.012',note:'Mean 2025 PEC for the continuing-growth scenario; especially relevant to dynamic stock accumulation.'},

  // Dynamic European ENM emissions; sediment result explicitly conservative.
  {id:'sun2016-cnt-sediment',study_id:'Sun2016',materials:['CNT'],metric:'active_sediment_pec_ug_kg',name:'CNT sediment concentration, worst-case dynamic scenario',target:6.7,unit:'µg/kg dry',year:2014,geo_groups:['Europe'],material_score:30,endpoint_score:18,boundary_score:6,evidence_type:'DPMFA_conservative',source:'Sun et al. (2016)',citation:'Environ. Sci. Technol. 50, 4701-4711',doi:'10.1021/acs.est.5b05828',url:'https://doi.org/10.1021/acs.est.5b05828',note:'Worst-case sediment scenario assumed complete sedimentation; use as an upper-bound consistency check, not a central target.'},

  // Nano-silica PMFA.
  {id:'wang2016-sio2-water',study_id:'Wang2016',materials:['nano-SiO2'],metric:'surface_water_pec_ug_L',name:'Nano-SiO2 European surface-water concentration',min:0.053,max:3.3,target:0.12,unit:'mg/m³',year:2014,geo_groups:['Europe'],material_score:30,endpoint_score:25,boundary_score:12,evidence_type:'PMFA',source:'Wang et al. (2016)',citation:'Sci. Total Environ. 545-546, 67-76',doi:'10.1016/j.scitotenv.2015.12.100',url:'https://doi.org/10.1016/j.scitotenv.2015.12.100',note:'European probabilistic nano-silica exposure model; reported median is 0.12 mg/m³ with Q15-Q85 of 0.053-3.3 mg/m³.'},

  // Nano-Ag regional PMFA with comparison to measurements.
  {id:'ding2019-ag-water',study_id:'Ding2019',materials:['AgNP'],metric:'surface_water_pec_ug_L',name:'Nano-Ag surface-water concentration in Hunan',target:0.0009,unit:'mg/m³',year:2017,reference_countries:['CN'],geo_groups:['Asia'],material_score:30,endpoint_score:25,boundary_score:13,evidence_type:'PMFA',source:'Ding et al. (2019)',citation:'Sci. Total Environ. 658, 1249-1255',doi:'10.1016/j.scitotenv.2018.12.254',url:'https://doi.org/10.1016/j.scitotenv.2018.12.254',note:'Regional modal concentration. The publication reports good consistency with available measurements for the modeled region.'},
  {id:'ding2019-ag-soil',study_id:'Ding2019',materials:['AgNP'],metric:'soil_pec_ug_kg',name:'Nano-Ag soil concentration in Hunan',target:0.020,unit:'µg/kg dry',year:2017,reference_countries:['CN'],geo_groups:['Asia'],material_score:30,endpoint_score:23,boundary_score:13,evidence_type:'PMFA',source:'Ding et al. (2019)',citation:'Sci. Total Environ. 658, 1249-1255',doi:'10.1016/j.scitotenv.2018.12.254',url:'https://doi.org/10.1016/j.scitotenv.2018.12.254',note:'Regional modal concentration; compare with matching soil definition where possible.'},
  {id:'ding2019-ag-sediment',study_id:'Ding2019',materials:['AgNP'],metric:'active_sediment_pec_ug_kg',name:'Nano-Ag sediment concentration in Hunan',target:6.9,unit:'µg/kg dry',year:2017,reference_countries:['CN'],geo_groups:['Asia'],material_score:30,endpoint_score:20,boundary_score:12,evidence_type:'PMFA',source:'Ding et al. (2019)',citation:'Sci. Total Environ. 658, 1249-1255',doi:'10.1016/j.scitotenv.2018.12.254',url:'https://doi.org/10.1016/j.scitotenv.2018.12.254',note:'Published sediment concentration is compared with the app active-sediment compartment.'},

  // Nanocellulose prospective DPMFA.
  {id:'stoudmann2019-nc-water-2015',study_id:'Stoudmann2019',materials:['Nanocellulose'],metric:'surface_water_pec_ug_L',name:'Nanocellulose European surface-water PEC (2015)',target:0.23,unit:'mg/m³',year:2015,geo_groups:['Europe'],material_score:25,endpoint_score:25,boundary_score:13,evidence_type:'DPMFA',source:'Stoudmann et al. (2019)',citation:'Environ. Sci.: Nano 6, 2520-2531',doi:'10.1039/C9EN00472F',url:'https://doi.org/10.1039/C9EN00472F',note:'Dynamic probabilistic assessment for the EU; nanocellulose encompasses material forms that may not match a project-specific cellulose nanoform.'},
  {id:'stoudmann2019-nc-water-2025',study_id:'Stoudmann2019',materials:['Nanocellulose'],metric:'surface_water_pec_ug_L',name:'Nanocellulose European surface-water PEC (2025)',target:2.37,unit:'mg/m³',year:2025,geo_groups:['Europe'],material_score:25,endpoint_score:25,boundary_score:13,evidence_type:'DPMFA',source:'Stoudmann et al. (2019)',citation:'Environ. Sci.: Nano 6, 2520-2531',doi:'10.1039/C9EN00472F',url:'https://doi.org/10.1039/C9EN00472F',note:'Prospective mean PEC under the study growth scenario; useful for dynamic future comparisons.'},

  // Measured U.S. WWTP engineered-particle concentrations.
  {id:'nabi2021-tio2-eff',study_id:'Nabi2021',materials:['nano-TiO2'],metric:'wwtp_effluent_concentration_ug_L',name:'Measured TiO2 engineered-particle concentration in WWTP effluent',min:7,max:30,unit:'mg/m³',year:null,publication_year:2021,reference_countries:['US'],geo_groups:['North America'],material_score:24,endpoint_score:25,boundary_score:12,evidence_type:'measurement',source:'Nabi et al. (2021)',citation:'Sci. Total Environ. 753, 142017',doi:'10.1016/j.scitotenv.2020.142017',url:'https://doi.org/10.1016/j.scitotenv.2020.142017',note:'Five U.S. WWTPs. Sampling year not verified from the inspected abstract; publication year is 2021. TiO2 engineered particles included a mixture of nanosized and pigment-sized particles; not identical to pristine nano-TiO2.'},
  {id:'nabi2021-ag-eff',study_id:'Nabi2021',materials:['AgNP'],metric:'wwtp_effluent_concentration_ug_L',name:'Measured Ag engineered-particle concentration in WWTP effluent',min:0.01,max:0.04,unit:'mg/m³',year:null,publication_year:2021,reference_countries:['US'],geo_groups:['North America'],material_score:25,endpoint_score:25,boundary_score:12,evidence_type:'measurement',source:'Nabi et al. (2021)',citation:'Sci. Total Environ. 753, 142017',doi:'10.1016/j.scitotenv.2020.142017',url:'https://doi.org/10.1016/j.scitotenv.2020.142017',note:'Five U.S. WWTPs. Sampling year not verified from the inspected abstract; publication year is 2021. Ag was quantified as total Ag in an engineered-particle assessment; nanoform comparability is imperfect.'},

  // Graphene DPMFA, corrected article acknowledged in source metadata.
  {id:'hong2022-graphene-water',study_id:'Hong2022',materials:['Graphene'],metric:'surface_water_pec_ug_L',name:'Graphene-based-material surface-water concentration (2030)',min:0.00073,max:0.0022,target:0.0014,unit:'mg/m³',year:2030,geo_groups:['Europe'],material_score:27,endpoint_score:25,boundary_score:13,evidence_type:'DPMFA',source:'Hong et al. (2022; 2024 correction)',citation:'Environ. Sci. Technol. 56, 13798-13809',doi:'10.1021/acs.est.2c04002',url:'https://doi.org/10.1021/acs.est.2c04002',note:'European GBM DPMFA. The 2024 correction concerns presentation of MFA results; the benchmark record cites the corrected publication history.'},
  {id:'hong2022-graphene-soil',study_id:'Hong2022',materials:['Graphene'],metric:'soil_pec_ug_kg',name:'Graphene-based-material sludge-treated-soil concentration (2030, corrected)',min:54,max:100,target:77,unit:'µg/kg dry',year:2030,geo_groups:['Europe'],material_score:27,endpoint_score:18,boundary_score:11,evidence_type:'DPMFA',source:'Hong et al. (2022; 2024 correction)',citation:'Environ. Sci. Technol. 56, 13798-13809; Correction 58, 14961-14962',doi:'10.1021/acs.est.2c04002',url:'https://doi.org/10.1021/acs.est.4c07878',note:'The 2024 correction revised the 2030 sludge-treated-soil result to a mean of 77 µg/kg with Q5-Q95 of 54-100 µg/kg. The compartment remains narrower than a generic national soil denominator.'},

  // Recent national PMFA for Mexico.
  {id:'ortiz2024-tio2-water',study_id:'OrtizGalvez2024',materials:['nano-TiO2'],metric:'surface_water_pec_ug_L',name:'Nano-TiO2 surface-water concentration in Mexico',min:0.038,max:0.055,target:0.046,unit:'mg/m³',year:2015,reference_countries:['MX'],geo_groups:['North America'],material_score:30,endpoint_score:25,boundary_score:8,evidence_type:'PMFA_conservative',source:'Ortiz-Galvez et al. (2024)',citation:'NanoImpact 35, 100516',doi:'10.1016/j.impact.2024.100516',url:'https://doi.org/10.1016/j.impact.2024.100516',note:'Q15-mean-Q85 national PMFA. Authors describe conservative production/release assumptions and no environmental transformation/removal; treat as a near-source worst-case screen.'},
  {id:'ortiz2024-tio2-soil',study_id:'OrtizGalvez2024',materials:['nano-TiO2'],metric:'soil_pec_ug_kg',name:'Nano-TiO2 soil concentration in Mexico',min:0.065,max:0.11,target:0.087,unit:'µg/kg dry',year:2015,reference_countries:['MX'],geo_groups:['North America'],material_score:30,endpoint_score:23,boundary_score:8,evidence_type:'PMFA_conservative',source:'Ortiz-Galvez et al. (2024)',citation:'NanoImpact 35, 100516',doi:'10.1016/j.impact.2024.100516',url:'https://doi.org/10.1016/j.impact.2024.100516',note:'Q15-mean-Q85. Conservative release assumptions and national-average environmental denominators limit direct transfer to another country.'},
  {id:'ortiz2024-tio2-eff',study_id:'OrtizGalvez2024',materials:['nano-TiO2'],metric:'wwtp_effluent_concentration_ug_L',name:'Nano-TiO2 treatment-plant effluent concentration in Mexico',min:13,max:99,target:53,unit:'mg/m³',year:2015,reference_countries:['MX'],geo_groups:['North America'],material_score:30,endpoint_score:22,boundary_score:8,evidence_type:'PMFA_conservative',source:'Ortiz-Galvez et al. (2024)',citation:'NanoImpact 35, 100516',doi:'10.1016/j.impact.2024.100516',url:'https://doi.org/10.1016/j.impact.2024.100516',note:'Published endpoint is STP effluent in the Mexico PMFA. Process definitions should be checked before treating it as equivalent to K-NanoMFA WWTP effluent.'}
];

const countryGroup={
  KR:'Asia',CN:'Asia',JP:'Asia',IN:'Asia',
  US:'North America',CA:'North America',MX:'North America',
  DE:'Europe',FR:'Europe',GB:'Europe',DK:'Europe',CH:'Europe',NO:'Europe',SE:'Europe',FI:'Europe',IT:'Europe',ES:'Europe',NL:'Europe',BE:'Europe',AT:'Europe',
  AU:'Oceania'
};
const evidenceScore={measurement:5,DPMFA:4.5,PMFA:4,screening_model:3.5,PMFA_conservative:3,DPMFA_conservative:3};
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function levelFromScore(s){return s>=80?'High':s>=60?'Moderate':s>=40?'Limited':'Low';}
function geographyScore(b,country){
  if(!country)return {score:7,reason:'current geography unavailable'};
  if((b.reference_countries||[]).includes(country))return {score:15,reason:'reference country matches'};
  const group=countryGroup[country];
  if(group&&(b.geo_groups||[]).includes(group))return {score:10,reason:`same broad region (${group})`};
  if((b.geo_groups||[]).length>1)return {score:7,reason:'multi-region reference'};
  return {score:4,reason:'reference geography differs'};
}
function temporalScore(referenceYear,currentYear){
  if(!Number.isFinite(referenceYear)||!Number.isFinite(currentYear))return {score:5,reason:'temporal match not resolved'};
  const d=Math.abs(referenceYear-currentYear);
  if(d===0)return {score:10,reason:'reference year matches'};
  if(d<=2)return {score:9,reason:`reference year differs by ${d} y`};
  if(d<=5)return {score:7,reason:`reference year differs by ${d} y`};
  if(d<=10)return {score:5,reason:`reference year differs by ${d} y`};
  return {score:2,reason:`reference year differs by ${d} y`};
}
function applicability(b,context={}){
  const geo=geographyScore(b,context.country_code);
  const temp=temporalScore(b.year==null?NaN:Number(b.year),Number(context.year));
  const components={
    material:Number.isFinite(b.material_score)?b.material_score:30,
    endpoint:Number.isFinite(b.endpoint_score)?b.endpoint_score:25,
    boundary:Number.isFinite(b.boundary_score)?b.boundary_score:10,
    geography:geo.score,
    temporal:temp.score,
    evidence:evidenceScore[b.evidence_type]||3
  };
  const score=clamp(Object.values(components).reduce((a,v)=>a+v,0),0,100);
  const reasons=[
    `material ${components.material}/30`,
    `endpoint ${components.endpoint}/25`,
    `boundary ${components.boundary}/15`,
    `${geo.reason} ${components.geography}/15`,
    `${temp.reason} ${components.temporal}/10`,
    `evidence ${components.evidence}/5`
  ];
  return {score,level:levelFromScore(score),components,reasons:reasons.join('; ')};
}
function concordance(value,b){
  if(!(Number.isFinite(value)&&value>=0))return {score:null,level:'Not available',label:'Not available',orders:null,direction:null};
  const positive=v=>Math.max(Number(v)||0,1e-30);
  let orders=0,direction='within';
  if(Number.isFinite(b.min)&&Number.isFinite(b.max)){
    if(value>=b.min&&value<=b.max)return {score:100,level:'High',label:'Within published range',orders:0,direction:'within'};
    const edge=value<b.min?b.min:b.max;
    direction=value<b.min?'below':'above';
    orders=Math.abs(Math.log10(positive(value)/positive(edge)));
  }else if(Number.isFinite(b.target)){
    const ratio=positive(value)/positive(b.target);
    direction=ratio<1?'below':ratio>1?'above':'within';
    orders=Math.abs(Math.log10(ratio));
  }else return {score:null,level:'Not available',label:'Published comparator unavailable',orders:null,direction:null};
  const score=clamp(100-35*orders,0,100);
  const level=levelFromScore(score);
  const label=orders<0.001?'Matches published target':`${orders.toFixed(2)} log10 unit${orders>=1?'s':''} ${direction} comparator`;
  return {score,level,label,orders,direction};
}
function forMaterial(material){return library.filter(b=>(b.materials||[]).includes(material));}
function uniqueStudies(rows){return new Set(rows.map(r=>r.study_id)).size;}
function studyWeightedApplicability(rows){
  const groups=new Map();
  rows.forEach(r=>{if(!groups.has(r.study_id))groups.set(r.study_id,[]);if(Number.isFinite(r.app?.score))groups.get(r.study_id).push(r.app.score);});
  const means=[...groups.values()].filter(v=>v.length).map(v=>v.reduce((a,x)=>a+x,0)/v.length);
  return means.length?means.reduce((a,x)=>a+x,0)/means.length:null;
}
function applicabilityWeightedConcordance(rows){
  let n=0,d=0;
  rows.forEach(r=>{if(Number.isFinite(r.app?.score)&&Number.isFinite(r.concordance?.score)){n+=r.app.score*r.concordance.score;d+=r.app.score;}});
  return d?n/d:null;
}
function summary(rows){
  const meanApp=studyWeightedApplicability(rows),weightedConc=applicabilityWeightedConcordance(rows);
  return {
    records:rows.length,
    studies:uniqueStudies(rows),
    study_weighted_mean_applicability:meanApp,
    applicability_level:Number.isFinite(meanApp)?levelFromScore(meanApp):'Not available',
    applicability_weighted_concordance:weightedConc,
    concordance_level:Number.isFinite(weightedConc)?levelFromScore(weightedConc):'Not available',
    strong_concordance_records:rows.filter(r=>Number.isFinite(r.concordance?.score)&&r.concordance.score>=80).length
  };
}
function coverage(){
  const materials=new Set();library.forEach(b=>(b.materials||[]).forEach(m=>materials.add(m)));
  return {records:library.length,studies:uniqueStudies(library),materials:[...materials].sort(),material_count:materials.size};
}
return {library,applicability,concordance,forMaterial,summary,coverage,levelFromScore,countryGroup};
});
