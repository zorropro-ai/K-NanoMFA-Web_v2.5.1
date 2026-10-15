(function(root,factory){const api=factory();root.KNanoResearch=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const R=typeof require==='function'?require('./reliability_core'):globalThis.KNanoReliability,F=typeof require==='function'?require('./dynamic_fate'):globalThis.KNanoDynamicFate;
const copy=x=>JSON.parse(JSON.stringify(x));
const ENV_UNITS={river_flow_m3_s:'m3/s',soil_area_ha:'ha',soil_depth_m:'m',soil_bulk_density_kg_m3:'kg/m3',sediment_area_km2:'km2',sediment_depth_m:'m',sediment_bulk_density_kg_m3:'kg/m3',air_mixing_height_m:'m'};
function parameters(context,config){const prepared=F.prepareConfig(context,config);return [...Object.entries(config.rates).map(([key,value])=>({key:'rates.'+key,value,unit:'1/year',derived:prepared.derived_rates[key]||'',effective_value:prepared.rates[key]})),...Object.entries(ENV_UNITS).map(([key,unit])=>({key:'environment.'+key,value:context.environment[key],unit})),{key:'water_residence_time_days',value:config.water_residence_time_days,unit:'days'},{key:'region.area_km2',value:context.region.area_km2,unit:'km2'},...(config.process_model?.enabled?Object.entries(config.process_model).filter(([k,v])=>k!=='enabled'&&R.finite(v)).map(([key,value])=>({key:'process_model.'+key,value,unit:({water_depth_m:'m',viscosity_pa_s:'Pa s',attachment_efficiency:'1',collision_kernel_m3_s:'m3/s',background_number_m3:'1/m3'}[key]||(key.endsWith('_nm')?'nm':key.endsWith('_kg_m3')?'kg/m3':'see parameter name'))})):[])];}
function auditEvidence(context,config){
 const records=config.evidence_register||[],report=parameters(context,config).map(p=>{const evidence=records.find(r=>r.parameter===p.key),issues=[];
  if(p.derived)return {...p,evidence_type:'derived',status:'derived; review primitive inputs',issues:[],source:p.derived};
  if(!evidence||evidence.evidence_type==='assumed')issues.push('Screening assumption');
  if(evidence&&!['assumed','measured','literature','calibrated'].includes(evidence.evidence_type))issues.push('Unknown evidence type');
  if(evidence)for(const k of ['minimum','maximum','cv','year_start','year_end'])if(evidence[k]!==undefined&&evidence[k]!==''&&(!R.finite(evidence[k])||(k==='cv'&&Number(evidence[k])<0)))issues.push('Invalid evidence '+k);
  if(evidence&&R.finite(evidence.minimum)&&R.finite(evidence.maximum)&&Number(evidence.minimum)>Number(evidence.maximum))issues.push('Inverted applicability range');
  if(evidence&&R.finite(evidence.year_start)&&R.finite(evidence.year_end)&&Number(evidence.year_start)>Number(evidence.year_end))issues.push('Inverted applicability period');
  if(!evidence?.source)issues.push('Source not documented');
  if(evidence&&evidence.unit!==p.unit)issues.push('Evidence unit differs from parameter unit');
  if(p.key.startsWith('rates.')||p.key.startsWith('process_model.')){if(!evidence?.material)issues.push('Material applicability missing');else if(evidence.material!==context.material)issues.push('Material mismatch');}
  if(!evidence?.domain_id)issues.push('Domain applicability missing');else if(evidence.domain_id!==context.region.domain_id)issues.push('Domain mismatch');
  if(!evidence?.conditions)issues.push('Conditions not documented');
  if(evidence&&R.finite(evidence.minimum)&&p.value<Number(evidence.minimum))issues.push('Below documented applicability range');
  if(evidence&&R.finite(evidence.maximum)&&p.value>Number(evidence.maximum))issues.push('Above documented applicability range');
  const years=context.mfa_args?.trajectory?.map(x=>x.year)||[context.baseYear];
  if(evidence&&R.finite(evidence.year_start)&&Math.min(...years)<Number(evidence.year_start))issues.push('Before documented period');
  if(evidence&&R.finite(evidence.year_end)&&Math.max(...years)>Number(evidence.year_end))issues.push('After documented period');
  return {...p,evidence_type:evidence?.evidence_type||'assumed',status:issues.length?'review required':'metadata consistent; source not independently certified',source:evidence?.source||'',issues};
 });return {rows:report,review_count:report.filter(r=>r.issues.length).length,statement:'Metadata checks do not certify empirical validity. Documented ranges describe applicability, not sampling bounds.'};
}
function editParameter(context,config,key,value){const ctx=copy(context),cfg=copy(config);if(key.startsWith('environment.'))ctx.environment[key.slice(12)]=value;else if(key.startsWith('region.'))ctx.region[key.slice(7)]=value;else if(key.startsWith('rates.'))cfg.rates[key.slice(6)]=value;else if(key.startsWith('process_model.'))cfg.process_model[key.slice(14)]=value;else cfg[key]=value;return {context:ctx,config:cfg};}
function output(base,nano,context,config){const o=F.compute(base,nano,context,config);if(!o)throw Error('Run the enabled fate model first.');if(o.converged===false)throw Error('Steady state did not converge.');return o;}
function* sensitivitySteps(base,nano,context,config,keys=null,fraction=.2){
 R.positive(fraction,'Perturbation');if(fraction>=1)throw Error('Perturbation must be below 1.');
 const baseline=output(base,nano,context,config),all=parameters(context,config),chosen=all.filter(p=>(!keys||keys.includes(p.key))&&!p.derived&&p.value>0),rows=[];
 for(const p of chosen){try{const low=editParameter(context,config,p.key,p.value*(1-fraction)),high=editParameter(context,config,p.key,p.value*(1+fraction));const a=output(base,nano,low.context,low.config),b=output(base,nano,high.context,high.config);for(const medium of F.COMPARTMENTS){const v=baseline.final_concentrations.total[medium],lo=a.final_concentrations.total[medium],hi=b.final_concentrations.total[medium];rows.push({parameter:p.key,medium,unit:p.unit,input:p.value,baseline:v,low:lo,high:hi,elasticity:v!==0?(hi-lo)/(2*fraction*v):null,max_relative_change:v!==0?Math.max(Math.abs(lo-v),Math.abs(hi-v))/Math.abs(v):null,status:'calculated'});}}catch(e){rows.push({parameter:p.key,status:'excluded',reason:e.message});}yield {completed:rows.length,total:chosen.length*4};}
 return {kind:'Local one-at-a-time fate sensitivity',fraction,rows:rows.sort((a,b)=>(b.max_relative_change||0)-(a.max_relative_change||0)),scope:'Fate kinetics and environmental capacities. Upstream MFA emissions held fixed. Derived rates are recomputed. Zero-valued parameters excluded from multiplicative perturbation.',limitations:'Not a global sensitivity ranking; interactions and alternative model structures are not resolved.'};
}
function sensitivity(...args){const g=sensitivitySteps(...args);let n;do{n=g.next()}while(!n.done);return n.value;}
async function sensitivityAsync(base,nano,context,config,onProgress=()=>{}){const g=sensitivitySteps(base,nano,context,config);let n;do{n=g.next();if(!n.done){onProgress(n.value);await new Promise(r=>setTimeout(r,0));}}while(!n.done);return n.value;}
async function stability(base,nano,context,config,options={},onProgress=()=>{}){
 const counts=options.counts||[500,1000,2000],seeds=options.seeds||[73,173,273],threshold=options.threshold??.1,runs=[];
 if(counts.length<2||counts.some(n=>!Number.isInteger(n)||n<10||n>5000)||new Set(counts).size!==counts.length)throw Error('Use at least two distinct integer counts from 10 to 5000.');
 if(seeds.length<2||seeds.some(n=>!Number.isInteger(n)||n<1||n>4294967295)||new Set(seeds).size!==seeds.length)throw Error('Use at least two distinct integer seeds in 1..4294967295.');
 if(!(threshold>0&&threshold<=1))throw Error('Threshold must be >0 and <=1.');
 for(const seed of seeds)for(const count of counts){const cfg=copy(config);cfg.uncertainty.enabled=true;cfg.uncertainty.seed=seed;cfg.uncertainty.iterations=count;const start=Date.now();const result=await F.runUncertaintyAsync(base,nano,context,cfg);runs.push({seed,iterations:count,seconds:(Date.now()-start)/1000,summary:result.summary,half_to_full:result.half_to_full_relative_quantile_change});onProgress({completed:runs.length,total:counts.length*seeds.length});await new Promise(r=>setTimeout(r,0));}
 const checks=[];for(const seed of seeds){const series=runs.filter(x=>x.seed===seed).sort((a,b)=>a.iterations-b.iterations);for(let i=1;i<series.length;i++)for(const medium of F.COMPARTMENTS)for(const q of ['P5','P50','P95']){const a=series[i-1].summary[medium][q],b=series[i].summary[medium][q];checks.push({kind:'count',seed,medium,quantile:q,from:series[i-1].iterations,to:series[i].iterations,relative_change:Math.abs(a-b)/Math.max(Math.abs(b),1e-30)});}}
 const maxN=Math.max(...counts);for(const medium of F.COMPARTMENTS)for(const q of ['P5','P50','P95']){const vals=runs.filter(x=>x.iterations===maxN).map(x=>x.summary[medium][q]),mean=vals.reduce((a,b)=>a+b,0)/vals.length;checks.push({kind:'seed_spread',medium,quantile:q,iterations:maxN,relative_change:(Math.max(...vals)-Math.min(...vals))/Math.max(Math.abs(mean),1e-30)});}
 return {kind:'Monte Carlo repeatability diagnostic',counts,seeds,threshold,runs,checks,passed:checks.every(r=>r.relative_change<=threshold),meaning:'Pass means changes stayed below the chosen numerical threshold in these trials. It is not field validation or a proof of distribution-tail convergence.'};
}
return {parameters,auditEvidence,editParameter,sensitivity,sensitivityAsync,stability};
});
