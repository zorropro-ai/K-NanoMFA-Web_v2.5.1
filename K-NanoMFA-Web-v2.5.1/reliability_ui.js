(function(){
  'use strict';
  const R=window.KNanoReliability,A=window.KNanoApp,F=window.KNanoDynamicFate;
  const $=id=>document.getElementById(id),copy=x=>JSON.parse(JSON.stringify(x));
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=x=>x===null||x===undefined?'—':Number(x).toLocaleString(undefined,{maximumSignificantDigits:5});
  let observations=[],comparison=null,initialized=false,calculatedSignature=null;
  const schema=['id','material','domain_id','model_source','medium','form','tracking_basis','statistic','year','observed','unit','role','source_note','qualifier','dataset_id','analytical_method','sampling_period','background_treatment','measurand_scope','independence'];
  const physicalFields={water_depth_m:'Water depth (m)',viscosity_pa_s:'Dynamic viscosity (Pa·s)',water_density_kg_m3:'Water density (kg/m³)',particle_density_kg_m3:'Effective particle density (kg/m³)',free_diameter_nm:'Free particle diameter (nm)',small_diameter_nm:'Small aggregate diameter (nm)',large_diameter_nm:'Large aggregate diameter (nm)',attachment_efficiency:'Attachment efficiency (0–1)',collision_kernel_m3_s:'Collision kernel (m³/s)',background_number_m3:'Background particles (number/m³)'};
  function baseSignature(){const s=A.state,a=window.KNanoAdvanced?.getState?.()||{};return JSON.stringify({mode:s.mode,material:A.materialDisplayName(),region:A.currentRegion(),baseYear:$('baseYear').value,total:$('totalMass').value,products:s.products,eol:s.eol,factors:s.factors,sludge:s.sludge,lifetimes:s.lifetimes,environment:s.environment,dynamic:s.dynamicSettings,trajectory:s.trajectory,geography:s.geography,releaseForms:s.releaseForms,inventory:window.KNanoProductInventory?.getState?.(),trade:a.trade,driver:a.dynamic_driver,target:a.target_stock});}
  function inputsCurrent(){return !!A.state.result&&calculatedSignature===baseSignature();}
  function context(){return {baseResult:A.state.result,fateOutput:F.getOutputs(),material:A.materialDisplayName(),domain_id:A.currentRegion().domain_id,baseYear:Number($('baseYear').value),calibration_dataset_ids:F.getState().calibration_dataset_ids||[],massComposition:{element_symbol:F.getState().element_symbol,element_mass_fraction:F.getState().element_mass_fraction}};}
  function invalidate(){comparison=null;if($('observationStatistics'))$('observationStatistics').innerHTML='';if($('observationChart'))$('observationChart').hidden=true;renderRows();}
  function setDensity(value){const density=['compact','standard','large'].includes(value)?value:'compact';document.documentElement.dataset.density=density;if($('textDensity'))$('textDensity').value=density;try{localStorage.setItem('KNanoMFA-text-density',density);}catch(_){}}
  function changeConfig(edit){const original=F.getState();let state=copy(original);edit(state);try{if(state.element_symbol!==original.element_symbol||state.element_mass_fraction!==original.element_mass_fraction)state=R.convertInitialStocks(A.materialDisplayName(),original,state);}catch(e){alert(e.message);syncControls();return;}F.loadState(state);invalidate();A.validate();syncControls();}
  function syncControls(){
    if(!initialized)return;const s=F.getState();
    const map={dfAdvectionMode:s.advection_mode||'hydraulic',dfElementSymbol:s.element_symbol||'',dfElementFraction:s.element_mass_fraction??'',dfExternalMode:s.external_coupling.mode||'dynamic',dfMissingYears:s.external_coupling.missing_year_policy||'reject',dfUncertaintyMode:s.uncertainty.mode||'linked',dfInputCv:s.uncertainty.input_cv,dfEnvironmentCv:s.uncertainty.environment_cv,dfFormCv:s.uncertainty.form_cv,dfWithinCorrelation:s.uncertainty.within_group_correlation};
    for(const [id,value] of Object.entries(map))if($(id))$(id).value=value;
    $('dfPhysicalEnabled').checked=Boolean(s.process_model?.enabled);
    for(const key of Object.keys(physicalFields)){const el=$('dfPhysical_'+key);if(el){el.value=s.process_model?.[key]??'';el.disabled=!s.process_model?.enabled;}}
    try{
      const h=R.hydrology(A.currentRegion(),A.state.environment,s),info=R.basisInfo(A.materialDisplayName(),s);
      $('dfHydrologyNote').textContent=`Q = ${fmt(h.flow_m3_s)} m³/s · V = ${fmt(h.volume_m3)} m³ · residence = ${fmt(h.residence_time_days)} days · Q/V = ${fmt(h.advective_rate_y)} /year. ${s.advection_mode==='custom'?'Custom advection rates are active.':'Q/V is applied to particulate and dissolved advection.'} Input conversion: 1 kg parent material = ${fmt(info.input_conversion_factor)} kg on the ${info.label} basis. ${(s.migration_notes||[]).join(' ')}`;
    }catch(e){$('dfHydrologyNote').textContent=e.message;}
    const region=A.currentRegion();
    const proxy=region.country_code==='KR'&&region.domain_level==='subnational'&&Math.abs(region.river_flow_m3_s_default/(region.wwtp_flow_m3_y/R.YEAR_SECONDS)-10)<1e-8;
    const qChanged=Math.abs(A.state.environment.river_flow_m3_s-region.river_flow_m3_s_default)>1e-8;
    const messages=[`Active domain: ${region.region}.`];
    if(proxy&&!qChanged)messages.push('Water flow uses the bundled wastewater × 10 proxy; it is not a measured river flow.');
    else messages.push('Check the source, period and spatial coverage of the receiving-water flow.');
    messages.push('Default soil/sediment areas and kinetic rates are screening assumptions. Record field sources before interpreting local PECs.');
    if($('pecEvidenceNote'))$('pecEvidenceNote').textContent=messages.join(' ');
    $('observationScope').textContent=`Active material: ${A.materialDisplayName()} · domain: ${region.domain_id}. A matching label is necessary but does not establish matching sampling conditions or independent validation.`;
  }
  function csvCell(x){return '"'+String(x??'').replaceAll('"','""')+'"';}
  function table(headers,rows){return '<table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
  function renderRows(){
    if(!$('observationRows'))return;
    $('observationRows').innerHTML=table(['ID','Model','Material / domain','Medium / form','Basis / statistic','Year','Observed','Unit','Role','Source'],observations.map(r=>[r.id,r.model_source,r.material+' / '+r.domain_id,r.medium+' / '+r.form,r.tracking_basis+' / '+r.statistic,r.year,r.observed,r.unit,r.role,r.source_note]));
    $('observationStatus').textContent=observations.length?`${observations.length} observation(s). ${comparison?'Comparison calculated.':'Run comparison after the model calculation.'}`:'No observations loaded. No empirical validation is claimed.';
  }
  function renderComparison(){
    if(!comparison)return;
    const blocks=Object.entries(comparison.groups).map(([label,s])=>`<div class="observation-group"><b>${esc(label)}</b>${table(['n','RMSE','Bias','Log10 RMSE','Geometric predicted/observed','Within ×2','Within ×10'],[[s.n,fmt(s.rmse),fmt(s.bias),fmt(s.log10_rmse),fmt(s.geometric_bias),fmt(s.within_factor_2_pct)+'%',fmt(s.within_factor_10_pct)+'%']])}</div>`);
    const pairs=table(['ID','Observed','Predicted','Canonical unit','Predicted/observed','Residual'],comparison.pairs.map(p=>[p.id,fmt(p.observed),fmt(p.predicted),p.canonical_unit,fmt(p.ratio),fmt(p.residual)]));
    const eligibility=table(['ID','Validation metadata'],comparison.pairs.map(r=>[r.id,r.eligible_for_independent_validation?'Metadata consistent; independence still requires review':r.validation_evidence_issues.join('; ')]));
    const excluded=comparison.excluded.length?'<p><b>Excluded from point statistics</b></p>'+table(['ID','Reason'],comparison.excluded.map(r=>[r.id,r.reason])):'';
    $('observationStatistics').innerHTML=`<p class="small">${esc(comparison.status)} Values are converted to a common concentration unit and mass basis within each group. Log metrics omit zero values.</p>`+blocks.join('')+'<div class="table-wrap">'+pairs+excluded+eligibility+'</div>';
    const chart=$('observationChart'),pairsByGroup={};
    comparison.pairs.forEach(p=>{const k=[p.medium,p.form,p.tracking_basis,p.statistic,p.role,p.canonical_unit].join(' / ');(pairsByGroup[k]??=[]).push(p);});
    // A chart is shown only for one comparable endpoint/unit group.
    if(Object.keys(pairsByGroup).length===1&&comparison.pairs.length){
      const group=Object.values(pairsByGroup)[0],positive=group.every(p=>p.observed>0&&p.predicted>0),values=group.flatMap(p=>[p.observed,p.predicted]),lo=Math.min(...values),hi=Math.max(...values);
      chart.hidden=false;Plotly.react(chart,[{type:'scatter',mode:'markers',x:group.map(p=>p.observed),y:group.map(p=>p.predicted),text:group.map(p=>p.id),name:'Observations',marker:{color:'#0b6b57',size:9}},{type:'scatter',mode:'lines',x:[lo,hi],y:[lo,hi],name:'1:1',line:{color:'#7a8a86',dash:'dash'}}],{margin:{l:65,r:20,t:25,b:65},xaxis:{title:'Observed ('+group[0].canonical_unit+')',type:positive?'log':'linear'},yaxis:{title:'Predicted ('+group[0].canonical_unit+')',type:positive?'log':'linear'},legend:{orientation:'h'},font:{family:'Arial, sans-serif',size:12},paper_bgcolor:'#fff',plot_bgcolor:'#fff'},{responsive:true,displaylogo:false});
    }else chart.hidden=true;
    $('observationStatus').textContent=`${comparison.pairs.length} matched · ${comparison.excluded.length} excluded · ${comparison.eligible_validation_pairs||0} pass validation metadata checks. Review sources and independence before drawing a validation conclusion.`;
  }
  function compare(){if(!inputsCurrent()){invalidate();$('observationStatus').textContent='Inputs changed or no current result exists. Run the MFA model before comparing observations.';return null;}comparison=R.compareObservations(observations,context());renderRows();renderComparison();return copy(comparison);}
  function buildObservationForm(){
    const options={sampling_period:{unknown:'Not established',full_year:'Representative full-year mean',year_end:'Year-end sampling',steady_representative:'Representative steady conditions',grab:'Single grab sample'},background_treatment:{unknown:'Not established',removed:'Background removed',negligible_documented:'Documented negligible background',not_applicable_documented:'Documented not applicable'},measurand_scope:{unknown:'Not established',engineered_material:'Engineered-material-specific',total_element:'Total element, including other sources'},independence:{unknown:'Not established',independent:'Independent of calibration',used_in_calibration:'Used in calibration'},model_source:{base:'Base MFA PEC',fate28:'28-state fate PEC'},medium:{water:'Water',air:'Air',soil:'Soil',sediment:'Sediment',effluent:'WWTP effluent',sludge:'Dry sludge'},form:{total:'Total tracked mass',free_particle:'Free particle',dissolved:'Dissolved',particulate:'Identified particulate forms',matrix_bound:'Matrix-bound',small_aggregate:'Small aggregate',large_aggregate:'Large aggregate',transformed_particle:'Transformed particle',unresolved:'Unresolved'},tracking_basis:{selected_material_equivalent:'Parent-material equivalent',constituent_element_equivalent:'Element equivalent'},statistic:{annual_mean:'Annual mean',year_end:'Year end',steady_state:'Steady state'},unit:{'ug/L':'µg/L','ng/L':'ng/L','mg/L':'mg/L','ng/m3':'ng/m³','ug/m3':'µg/m³','ug/kg_dry':'µg/kg dry','mg/kg_dry':'mg/kg dry'},role:{validation:'Independent validation set',calibration:'Calibration set'},qualifier:{'=':'Quantified','<':'Below detection/quantification limit'}};
    const labels={dataset_id:'Dataset ID',analytical_method:'Analytical method / size window',sampling_period:'Sampling coverage',background_treatment:'Background treatment',measurand_scope:'Measurement source scope',independence:'Calibration independence',id:'Observation ID',material:'Measured material',domain_id:'Domain ID',model_source:'Prediction source',medium:'Medium',form:'Measured form',tracking_basis:'Measured mass basis',statistic:'Time statistic',year:'Year',observed:'Measured concentration',unit:'Measured unit',role:'Data role',source_note:'Source / method / sampling note',qualifier:'Result qualifier'};
    $('observationFields').innerHTML=schema.map(key=>'<label>'+labels[key]+(options[key]?`<select id="obs_${key}">${Object.entries(options[key]).map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`:`<input id="obs_${key}" type="${['year','observed'].includes(key)?'number':'text'}" ${key==='observed'?'min="0" step="any"':''}/>` )+'</label>').join('');
    $('obs_material').value=A.materialDisplayName();$('obs_domain_id').value=A.currentRegion().domain_id;$('obs_year').value=$('baseYear').value;
    $('addObservation').onclick=()=>{const row=Object.fromEntries(schema.map(k=>[k,$('obs_'+k).value.trim()]));if(!row.id)row.id='obs-'+(observations.length+1);if(!row.source_note||!R.finite(row.observed)||Number(row.observed)<0){alert('Enter a non-negative observed concentration and its source/method note.');return;}observations.push(row);invalidate();$('obs_id').value='';$('obs_observed').value='';};
  }
  function init(){
    initialized=true;
    let density='compact';try{density=localStorage.getItem('KNanoMFA-text-density')||density;}catch(_){}setDensity(density);$('textDensity').onchange=e=>setDensity(e.target.value);
    const banner=document.createElement('div');banner.id='pecEvidenceNote';banner.className='notice evidence-note';$('regionSummary').after(banner);
    $('dfPhysicalInputs').innerHTML=Object.entries(physicalFields).map(([key,label])=>`<label>${label}<input type="number" min="0" step="any" id="dfPhysical_${key}"/></label>`).join('');
    for(const key of Object.keys(physicalFields))$('dfPhysical_'+key).onchange=e=>changeConfig(s=>s.process_model[key]=e.target.value===''?'':Number(e.target.value));
    $('dfPhysicalEnabled').onchange=e=>changeConfig(s=>s.process_model.enabled=e.target.checked);
    const maps={dfAdvectionMode:['advection_mode'],dfElementSymbol:['element_symbol'],dfElementFraction:['element_mass_fraction'],dfExternalMode:['external_coupling','mode'],dfMissingYears:['external_coupling','missing_year_policy'],dfUncertaintyMode:['uncertainty','mode'],dfInputCv:['uncertainty','input_cv'],dfEnvironmentCv:['uncertainty','environment_cv'],dfFormCv:['uncertainty','form_cv'],dfWithinCorrelation:['uncertainty','within_group_correlation']};
    for(const [id,keys] of Object.entries(maps))$(id).onchange=e=>changeConfig(s=>{let o=s;keys.slice(0,-1).forEach(k=>o=o[k]);o[keys.at(-1)]=e.target.type==='number'?(e.target.value===''?'':Number(e.target.value)):e.target.value;});
    $('benchmarkSource').onchange=()=>A.renderBenchmark();
    buildObservationForm();
    $('observationTemplate').onclick=()=>A.download('K-NanoMFA_observations_template.csv',schema.join(',')+'\n','text/csv;charset=utf-8');
    $('importObservations').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const rows=F.parseCsvTable(await file.text()),head=rows.shift().map(x=>x.trim());if(schema.slice(0,13).some(k=>!head.includes(k)))throw Error('Use the template columns, including source_note, statistic and tracking_basis.');observations=rows.map(row=>Object.fromEntries(head.map((key,i)=>[key,String(row[i]??'').trim()])));invalidate();}catch(error){alert(error.message);}finally{e.target.value='';}};
    $('compareObservations').onclick=compare;
    $('clearObservations').onclick=()=>{if(!observations.length||confirm('Clear the loaded observation records?')){observations=[];invalidate();}};
    $('exportObservations').onclick=()=>{if(!comparison||!inputsCurrent()){alert('Run the MFA and observation comparison first.');return;}window.KNanoExcel.exportObject('K-NanoMFA_observed_comparison_v251.xlsx',{material:A.materialDisplayName(),domain:A.currentRegion().domain_id,comparison,observations},{kind:'Observed concentration comparison',dataSheet:'Comparison_Data'});};
    window.addEventListener('knano:model-updated',()=>{calculatedSignature=baseSignature();invalidate();syncControls();A.renderBenchmark();});
    window.addEventListener('knano:fate-updated',()=>{invalidate();syncControls();A.renderBenchmark();});
    // Any scientific input edit invalidates a previously computed comparison.
    document.addEventListener('change',e=>{if(e.target.closest('#observationPanel')||e.target.closest('.topbar'))return;invalidate();if(calculatedSignature&&A.state.result&&!inputsCurrent())A.clearResults();setTimeout(syncControls,0);});
    if(window.__KNANO_PENDING_RELIABILITY){loadState(window.__KNANO_PENDING_RELIABILITY);delete window.__KNANO_PENDING_RELIABILITY;}
    syncControls();renderRows();
  }
  function getState(){return {schema:'K-NanoMFA-evidence-v2.5.1',observations:copy(observations),benchmark_source:$('benchmarkSource')?.value||'base'};}
  function loadState(s){if(!initialized){window.__KNANO_PENDING_RELIABILITY=copy(s||{});return;}observations=copy(s?.observations||[]);$('benchmarkSource').value=s?.benchmark_source==='fate28'?'fate28':'base';invalidate();syncControls();}
  window.KNanoReliabilityUI={getState,loadState,syncControls,compare,inputsCurrent,getComparison:()=>comparison&&inputsCurrent()?copy(comparison):null};
  document.addEventListener('DOMContentLoaded',init);
})();
