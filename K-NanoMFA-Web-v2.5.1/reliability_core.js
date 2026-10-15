(function(root,factory){const api=factory();root.KNanoReliability=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const YEAR_SECONDS=365.25*86400;
  const MATERIALS={
    'AgNP':{element:'Ag',fraction:1,preset:'dissolving_metal'},
    'nano-ZnO':{element:'Zn',fraction:65.38/(65.38+15.999),preset:'dissolving_metal'},
    'nano-TiO2':{element:'Ti',fraction:47.867/(47.867+2*15.999),preset:'persistent_oxide'},
    'nano-SiO2':{element:'Si',fraction:28.085/(28.085+2*15.999),preset:'persistent_oxide'},
    'CNT':{element:'C',fraction:1,preset:'high_aspect_ratio'},
    'Carbon black':{element:'C',fraction:1,preset:'carbonaceous'},
    'Graphene':{element:'C',fraction:1,preset:'carbonaceous'},
    'Fullerenes':{element:'C',fraction:1,preset:'carbonaceous'},
    'Nanocellulose':{preset:'biodegradable'},'Nanoclay':{preset:'persistent_oxide'}
  };
  function finite(v){return !(typeof v==='string'&&!v.trim())&&v!==''&&v!==null&&v!==undefined&&typeof v!=='boolean'&&Number.isFinite(Number(v));}
  function positive(v,label){if(!finite(v)||Number(v)<=0)throw Error(`${label} must be a finite positive number.`);return Number(v);}
  function nonnegative(v,label){if(!finite(v)||Number(v)<0)throw Error(`${label} must be a finite non-negative number.`);return Number(v);}
  function basisInfo(material,config={}){
    const known=MATERIALS[material]||{},custom=config.element_mass_fraction;
    const fraction=finite(custom)?Number(custom):known.fraction;
    const element=String(config.element_symbol||known.element||'').trim();
    if(config.tracking_basis==='constituent_element_equivalent'){
      if(!(fraction>0&&fraction<=1)||!element)throw Error('Element tracking requires a documented element symbol and mass fraction for this material. Select parent-material-equivalent mass or supply the composition.');
      return {tracking_basis:config.tracking_basis,element,fraction,label:`${element}-equivalent mass`,input_basis:'selected_material_equivalent',input_conversion_factor:fraction};
    }
    if(config.tracking_basis!=='selected_material_equivalent')throw Error('Select parent-material-equivalent or constituent-element-equivalent tracking. Total transformed-solid and pristine-only mass require a separate stoichiometric/species model.');
    return {tracking_basis:config.tracking_basis,element:element||null,fraction:fraction||null,label:`${material} parent-material-equivalent mass`,input_basis:'selected_material_equivalent',input_conversion_factor:1};
  }
  function basisFactor(from,to,info){
    if(from===to)return 1;
    if(!['selected_material_equivalent','constituent_element_equivalent'].includes(from))throw Error(`Unsupported input mass basis: ${from}.`);
    if(!(info.fraction>0&&info.fraction<=1))throw Error('Mass-basis conversion requires a documented element fraction.');
    return to==='constituent_element_equivalent'?info.fraction:1/info.fraction;
  }
  function hydrology(region,env,config){
    positive(region?.area_km2,'Domain area');positive(env?.air_mixing_height_m,'Air mixing height');
    ['soil_area_ha','soil_depth_m','soil_bulk_density_kg_m3','sediment_area_km2','sediment_depth_m','sediment_bulk_density_kg_m3'].forEach(k=>positive(env?.[k],k));
    const q=positive(env?.river_flow_m3_s,'Water flow'),days=positive(config.water_residence_time_days,'Water residence time');
    return {flow_m3_s:q,residence_time_days:days,volume_m3:q*86400*days,advective_rate_y:365.25/days};
  }
  function consecutiveYears(rows,policy='reject',makeZero){
    if(!rows.length)throw Error('At least one annual input is required.');
    const sorted=[...rows].sort((a,b)=>Number(a.year)-Number(b.year));
    const out=[];
    for(const row of sorted){
      if(!Number.isInteger(Number(row.year))||Number(row.year)<1)throw Error('Annual inputs require positive integer years.');
      const previous=out.at(-1);
      if(previous&&Number(row.year)===Number(previous.year))throw Error(`Duplicate year ${row.year}.`);
      if(previous&&Number(row.year)>Number(previous.year)+1){
        if(policy!=='zero_fill')throw Error(`Missing annual input after ${previous.year}. Add the missing years or explicitly select zero emissions for missing years.`);
        if(Number(row.year)-Number(previous.year)>500)throw Error('Annual input gap exceeds 500 years.');
        for(let y=Number(previous.year)+1;y<Number(row.year);y++)out.push(makeZero(y));
      }
      out.push(row);
    }
    if(out.length>500)throw Error('A maximum of 500 annual input rows is supported.');
    return out;
  }
  // Augment x'=Kx+u with integrated occupancy. No inversion of K is needed.
  function linearStep(matrix,initial,input,dt=1,tolerance=1e-12){
    positive(dt,'Time step');const n=initial.length,dim=2*n+1,rows=Array.from({length:dim},()=>[]);
    let bound=0;
    for(let i=0;i<n;i++){
      nonnegative(initial[i],'Initial stock');nonnegative(input[i],'Input');
      for(let j=0;j<n;j++){if(!finite(matrix[i][j]))throw Error('Invalid transition matrix.');if(matrix[i][j])rows[i].push([j,matrix[i][j]]);}
      if(input[i])rows[i].push([2*n,input[i]]);rows[n+i].push([i,1]);bound=Math.max(bound,Math.abs(matrix[i][i]));
    }
    let z=[...initial,...Array(n).fill(0),1];const segments=Math.max(1,Math.ceil(dt*(bound+1)/2));
    if(segments>200000)throw Error('Rate/time-step combination exceeds the supported numerical range.');
    const h=dt/segments;
    for(let s=0;s<segments;s++){
      let term=z.slice(),acc=z.slice();
      for(let k=1;k<=90;k++){
        term=rows.map(row=>row.reduce((a,[j,v])=>a+v*term[j],0)*h/k);
        acc=acc.map((v,i)=>v+term[i]);
        if(Math.max(...term.map(Math.abs))<=tolerance*Math.max(1,...acc.map(Math.abs)))break;
        if(k===90)throw Error('Linear solver did not converge.');
      }
      z=acc;
    }
    const stocks=z.slice(0,n);if(stocks.some(x=>x < -1e-9*Math.max(1,...initial)))throw Error('Material negative stock from linear solver.');
    return {stocks:stocks.map(x=>Math.max(0,x)),occupancy:z.slice(n,2*n)};
  }
  function integrate(f,a,b,tol=1e-10){
    function rec(a,b,fa,fm,fb,whole,tol,depth){const m=(a+b)/2,l=(a+m)/2,r=(m+b)/2,fl=f(l),fr=f(r),left=(m-a)*(fa+4*fl+fm)/6,right=(b-m)*(fm+4*fr+fb)/6,delta=left+right-whole;if(depth===0||Math.abs(delta)<=15*tol)return left+right+delta/15;return rec(a,m,fa,fl,fm,left,tol/2,depth-1)+rec(m,b,fm,fr,fb,right,tol/2,depth-1);}
    if(b<=a)return 0;const fa=f(a),fm=f((a+b)/2),fb=f(b);return rec(a,b,fa,fm,fb,(b-a)*(fa+4*fm+fb)/6,tol,18);
  }
  const structureCache=new WeakMap();
  function steadyDiagnostics(matrix,before,after,input,tolerance=1e-7){
    const n=after.length,absolute=1e-14;
    const key=input.map(x=>x>0?1:0).join('')+'|'+matrix.map(row=>row.join(',')).join(';'),cached=structureCache.get(matrix);let trapped=cached?.key===key?cached.trapped:null;
    if(!trapped){
    const sinks=Array.from({length:n},(_,j)=>-matrix.reduce((a,row)=>a+row[j],0));
    const reachable=new Set(input.flatMap((x,i)=>x>0?[i]:[])),escape=new Set(sinks.flatMap((v,i)=>v>1e-12*Math.max(1e-30,Math.abs(matrix[i][i]))?[i]:[]));
    for(let pass=0;pass<n;pass++)for(let j=0;j<n;j++)for(let i=0;i<n;i++)if(i!==j&&matrix[i][j]>0){if(reachable.has(j))reachable.add(i);if(escape.has(i))escape.add(j);}
    trapped=[...reachable].filter(i=>!escape.has(i));structureCache.set(matrix,{key,trapped});
    }
    const states=after.map((mass,i)=>{
      const inflow=input[i]+matrix[i].reduce((a,k,j)=>a+(j!==i?k*after[j]:0),0),outflow=-matrix[i][i]*mass,residual=inflow-outflow,change=Math.abs(mass-before[i]);
      const fluxScale=Math.max(Math.abs(inflow),Math.abs(outflow)),stockScale=Math.max(Math.abs(mass),Math.abs(before[i]));
      return {index:i,residual_kg_y:residual,relative_flux_residual:fluxScale>0?Math.abs(residual)/fluxScale:0,relative_stock_change:stockScale>0?change/stockScale:0,passed:Math.abs(residual)<=absolute+tolerance*fluxScale&&change<=absolute+tolerance*stockScale};
    });
    return {converged:!trapped.length&&states.every(x=>x.passed),trapped_forced_state_indices:trapped,absolute_tolerance_kg: absolute,relative_tolerance:tolerance,states,reason:trapped.length?'Continuous input reaches states with no external removal path.':states.every(x=>x.passed)?'Every state passes stock-change and flux-residual checks.':'One or more states have not reached balance.'};
  }
  function convertInitialStocks(material,oldConfig,nextConfig){
    const next=JSON.parse(JSON.stringify(nextConfig)),old=basisInfo(material,oldConfig),target=basisInfo(material,nextConfig);
    const physicalOld=old.tracking_basis==='constituent_element_equivalent'?old.fraction:1,physicalNew=target.tracking_basis==='constituent_element_equivalent'?target.fraction:1;
    const factor=physicalNew/physicalOld;
    Object.entries(oldConfig.initial_stock_kg||{}).forEach(([k,v])=>next.initial_stock_kg[k]=nonnegative(v,k+' initial stock')*factor);
    next.mass_conversion_log=[...(oldConfig.mass_conversion_log||[]),{from:old.label,to:target.label,factor,scope:'Initial stocks only. External rows retain their declared basis.'}];return next;
  }
  function pairedStats(pairs){
    const valid=pairs.filter(p=>finite(p.observed)&&finite(p.predicted)&&Number(p.observed)>=0&&Number(p.predicted)>=0),n=valid.length;
    if(!n)return {n:0,rmse:null,bias:null,log10_rmse:null,geometric_bias:null,within_factor_2_pct:null,within_factor_10_pct:null,positive_n:0};
    const errors=valid.map(p=>Number(p.predicted)-Number(p.observed)),logs=valid.filter(p=>p.observed>0&&p.predicted>0).map(p=>Math.log10(p.predicted/p.observed));
    return {n,rmse:Math.sqrt(errors.reduce((a,x)=>a+x*x,0)/n),bias:errors.reduce((a,x)=>a+x,0)/n,positive_n:logs.length,log10_rmse:logs.length?Math.sqrt(logs.reduce((a,x)=>a+x*x,0)/logs.length):null,geometric_bias:logs.length?10**(logs.reduce((a,x)=>a+x,0)/logs.length):null,within_factor_2_pct:logs.length?100*logs.filter(x=>Math.abs(x)<=Math.log10(2)).length/logs.length:null,within_factor_10_pct:logs.length?100*logs.filter(x=>Math.abs(x)<=1).length/logs.length:null};
  }
  function compareObservations(rows,context){
    const map={air:'air_pec_ng_m3',water:'surface_water_pec_ug_L',soil:'soil_pec_ug_kg',sediment:'active_sediment_pec_ug_kg',effluent:'wwtp_effluent_concentration_ug_L',sludge:'sewage_sludge_concentration_ug_kg_dry'};
    const compForms=['matrix_bound','free_particle','small_aggregate','large_aggregate','transformed_particle'];
    const pairs=[],excluded=[],seen=new Set();
    const calibrationIds=new Set([...(context.calibration_dataset_ids||[]),...rows.filter(r=>r.role==='calibration').map(r=>r.dataset_id).filter(Boolean)]);
    for(const row of rows){try{
      for(const key of ['id','material','domain_id','model_source','medium','form','tracking_basis','statistic','year','observed','unit','role','source_note'])if(String(row[key]??'').trim()==='')throw Error('Missing '+key);
      if(seen.has(row.id))throw Error('Duplicate observation ID.');seen.add(row.id);
      if(row.material!==context.material)throw Error('Material does not match.');
      if(row.domain_id!==context.domain_id)throw Error('Domain does not match.');
      if(!['validation','calibration'].includes(row.role))throw Error('Role must be validation or calibration.');
      if(row.qualifier&&row.qualifier!=='=')throw Error('Censored/non-detect observation; no substitution is applied.');
      const observed=nonnegative(row.observed,'Observed concentration'),year=Number(row.year);if(!Number.isInteger(year))throw Error('Year must be an integer.');
      let prediction,info;
      if(row.model_source==='fate28'){
        const fate=context.fateOutput;if(!fate)throw Error('Run the 28-state fate model first.');
        if(fate.converged===false)throw Error('Steady state has not converged.');
        let concentrations;
        if(fate.mode.startsWith('steady')){
          if(row.statistic!=='steady_state'||year!==Number(context.baseYear))throw Error('Require steady_state and the active reference year.');concentrations=fate.final_concentrations;
        }else{
          const annual=fate.annual.find(x=>Number(x.year)===year);if(!annual)throw Error('No prediction for this year.');
          if(row.statistic==='year_end')concentrations=annual.concentrations;
          else if(row.statistic==='annual_mean')concentrations=annual.annual_mean_concentrations;
          else throw Error('Dynamic fate requires year_end or annual_mean.');
        }
        if(!concentrations)throw Error('The selected time statistic is unavailable.');
        const selected=concentrations.rows.filter(r=>r.compartment===row.medium&&(row.form==='total'||(row.form==='particulate'?compForms.includes(r.form):r.form===row.form)));
        if(!selected.length)throw Error('No matching medium/form output.');prediction=selected.reduce((a,r)=>a+r.value,0);info=fate.mass_basis;
      }else if(row.model_source==='base'){
        const base=context.baseResult;if(!base)throw Error('Run the MFA model first.');
        if(row.form!=='total')throw Error('Base PEC does not resolve measured forms.');
        const record=base.model==='dynamic'?base.annual.find(r=>Number(r.year)===year):base;
        if(!record||(base.model!=='dynamic'&&year!==Number(context.baseYear)))throw Error('No prediction for this year.');
        const needed=['soil','sediment'].includes(row.medium)?(base.model==='dynamic'?'year_end':'steady_state'):'annual_mean';
        if(row.statistic!==needed)throw Error('Base output requires '+needed+'.');
        prediction=record.pec?.[map[row.medium]];info=basisInfo(context.material,{tracking_basis:'selected_material_equivalent',...(context.massComposition||{})});
      }else throw Error('Unknown model_source.');
      if(!finite(prediction))throw Error('Prediction is unavailable.');
      if(!['selected_material_equivalent','constituent_element_equivalent'].includes(row.tracking_basis))throw Error('Unsupported observation mass basis.');
      prediction*=basisFactor(info.tracking_basis,row.tracking_basis,info);
      const unit=String(row.unit).replaceAll('µ','u').replaceAll('μ','u').replaceAll('³','3').replace(/\s+/g,'').toLowerCase();
      const units=['water','effluent'].includes(row.medium)?{'ug/l':1,'mg/m3':1,'ng/l':.001,'mg/l':1000}:row.medium==='air'?{'ng/m3':1,'ug/m3':1000}:{'ug/kg_dry':1,'mg/kg_dry':1000};
      if(!(unit in units))throw Error('Unsupported or ambiguous unit. Soil/sediment/sludge require a dry-weight unit.');
      const canonical=observed*units[unit],canonicalUnit=['water','effluent'].includes(row.medium)?'ug/L':row.medium==='air'?'ng/m3':'ug/kg dry';
      const evidenceIssues=[];
      for(const key of ['dataset_id','analytical_method','sampling_period','background_treatment','measurand_scope','independence'])if(!String(row[key]||'').trim())evidenceIssues.push('Missing '+key);
      if(row.role!=='validation')evidenceIssues.push('Calibration data');
      if(calibrationIds.has(row.dataset_id))evidenceIssues.push('Dataset also used for calibration');
      if(row.independence!=='independent')evidenceIssues.push('Independence not declared');
      if(row.measurand_scope!=='engineered_material')evidenceIssues.push('Measurement may include background or other material sources');
      if(!['removed','negligible_documented','not_applicable_documented'].includes(row.background_treatment))evidenceIssues.push('Background handling not established');
      const requiredSampling={annual_mean:'full_year',year_end:'year_end',steady_state:'steady_representative'}[row.statistic];
      if(row.sampling_period!==requiredSampling)evidenceIssues.push('Sampling period does not represent the model time statistic');
      pairs.push({...row,validation_evidence_issues:[...new Set(evidenceIssues)],eligible_for_independent_validation:evidenceIssues.length===0,year,observed:canonical,original_observed:observed,predicted:prediction,canonical_unit:canonicalUnit,ratio:canonical>0?prediction/canonical:null,residual:prediction-canonical});
    }catch(error){excluded.push({...row,reason:error.message});}}
    const groups={};for(const p of pairs){const key=[p.model_source,p.medium,p.form,p.tracking_basis,p.statistic,p.role].join(' | ');(groups[key]??=[]).push(p);}
    return {pairs,excluded,eligible_validation_pairs:pairs.filter(p=>p.eligible_for_independent_validation).length,groups:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,pairedStats(v)])),status:'Diagnostic comparison only. Data-role labels and fit statistics do not certify independent validation.',excluded_count:excluded.length};
  }
  return {steadyDiagnostics,convertInitialStocks,YEAR_SECONDS,MATERIALS,finite,positive,nonnegative,basisInfo,basisFactor,hydrology,consecutiveYears,linearStep,integrate,pairedStats,compareObservations};
});
