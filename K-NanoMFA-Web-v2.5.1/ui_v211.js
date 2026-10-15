(()=>{
'use strict';
const $=id=>document.getElementById(id);
const AUTOSAVE_KEY='K-NanoMFA-v220-autosaves';
const MAX_SNAPSHOTS=5;
const STAGES=[
 {id:'scope',label:'Study setup',feature:'model-mode'},
 {id:'inventory',label:'Product inventory',feature:'product-categories'},
 {id:'release',label:'Release & fate',feature:'treatment'},
 {id:'evidence',label:'Evidence & uncertainty',feature:'model-specification'},
 {id:'results',label:'Results & mixtures',feature:'results'},
 {id:'expert',label:'Expert tools',feature:'trade'}
];
const HELP={
 modelModePanel:{title:'Temporal and uncertainty structure',chapter:'5. Study setup',page:10,purpose:'Choose whether the assessment is a one-year deterministic calculation, a one-year probabilistic calculation, or a multi-year cohort model.',when:'Set this before editing dynamic trajectories or running probabilistic analysis.',inputs:'Model mode; base year or dynamic horizon.',caution:'Changing the model mode can make lifetime, trajectory, or Monte Carlo settings relevant or irrelevant.'},
 productInventoryPanel:{title:'Product-informed ENM inventory',chapter:'6. Product inventory and life cycle',page:13,purpose:'Convert product-market quantities, nanomaterial content, and nano-enabled market share into a material inflow.',when:'Use when product sales, product mass, coated area, or product volume are available instead of direct ENM mass.',inputs:'Product quantity, conversion factor, ENM content, nano-enabled share, evidence note.',caution:'Product-market data are not automatically national ENM inventories; verify scope, year, and units.'},
 productCategoryPanel:{title:'Product categories and use-stage release',chapter:'6.4 Product categories and end-of-life',page:15,purpose:'Allocate nanomaterial inflow among product categories and define use-stage release flows.',when:'Review for every standard or product-informed MFA.',inputs:'Allocation percentages and use-stage release fractions.',caution:'Allocations must sum to 100%; release fractions are screening priors unless replaced.'},
 treatmentCoefficientPanel:{title:'Treatment-process transfer coefficients',chapter:'7. Treatment, geography, and PEC settings',page:17,purpose:'Define process transfer coefficients for wastewater treatment, incineration, landfill, recycling, reuse, and sludge management.',when:'Use whenever treatment or waste-management assumptions differ from the bundled preset.',inputs:'Process-specific transfer and removal percentages.',caution:'Avoid mixing dry-mass and wet-mass sludge bases.'},
 geographyDataPanel:{title:'Geographic calculation basis',chapter:'7.2 Geographic denominators',page:18,purpose:'Define population, wastewater, receiving-water, soil, sediment, and atmospheric denominators.',when:'Review when changing country, subnational domain, or geographic scaling basis.',inputs:'Country/domain statistics and environmental capacities.',caution:'Population or flow scaling is a transparent allocation assumption, not a measured local market inventory.'},
 pecSettingsPanel:{title:'Environmental-media PEC settings',chapter:'7.2 Geographic denominators',page:18,purpose:'Convert environmental releases or stocks into screening concentrations.',when:'Use when site or region-specific water flow, soil depth, sediment depth, or mixing height is available.',inputs:'Residence time, depth, density, area, and mixing-height settings.',caution:'PECs inherit all upstream release and capacity assumptions.'},
 releaseFormPanel:{title:'Release-form allocation',chapter:'8.1 Release-form allocation',page:20,purpose:'Divide releases into matrix-associated, free, aggregated, transformed/dissolved, and unresolved forms.',when:'Use before nanoform-state or dynamic-fate analysis.',inputs:'Medium-specific release-form percentages.',caution:'Each medium must total 100%; unresolved fractions should remain explicit when evidence is missing.'},
 nanoformPanel:{title:'Nanoform state tracking',chapter:'8.2 Nanoform state tracking',page:21,purpose:'Allocate environmental release flows and final stock additions among operational nanoform states.',when:'Use when matrix binding, aggregation, dissolution, or transformation changes interpretation.',inputs:'Material preset, embedding preset, state fractions, and medium splits.',caution:'This layer is mass-conserving screening allocation, not a particle-resolved mechanistic model.'},
 dynamicFatePanel:{title:'Dynamic nanoform fate',chapter:'8.3 Dynamic nanoform fate',page:22,purpose:'Propagate state-resolved emissions through air, water, soil, and sediment using coupled first-order kinetics.',when:'Use when time-dependent dissolution, aggregation, settling, transfer, or external outflows matter.',inputs:'Tracked material basis, solver, kinetic rates, initial stocks, storm events, and external inflow coupling.',caution:'Replace preset rates with material-, medium-, and region-specific evidence where available.'},
 modelSpecificationPanel:{title:'Model specification and boundary',chapter:'9.1 Model specification',page:25,purpose:'Record study identity, accounting boundary, functional basis, and reporting assumptions.',when:'Complete before exporting a publication or regulatory-support package.',inputs:'Study title, purpose, boundary, source notes, and interpretation limits.',caution:'Incomplete metadata reduces reproducibility even when calculations are valid.'},
 qualityMatrixPanel:{title:'Data quality and uncertainty',chapter:'9. Evidence, uncertainty, and sensitivity',page:25,purpose:'Describe evidence quality and map it to uncertainty assumptions.',when:'Use for probabilistic analysis or evidence review.',inputs:'Reliability, geography, temporal, technology, completeness, and CV scores.',caution:'Quality scores are structured judgments and should be justified in source notes.'},
 probabilisticPanel:{title:'Probabilistic simulation',chapter:'9.3 Probabilistic simulation',page:27,purpose:'Propagate selected parameter uncertainty to P5, P50, and P95 outputs.',when:'Use after deterministic inputs pass readiness checks.',inputs:'Iterations, random seed, and uncertainty settings.',caution:'Module-specific uncertainty is not automatically equivalent to full-chain uncertainty.'},
 resultsArea:{title:'Main MFA results',chapter:'10. Results, comparison, and export',page:29,purpose:'Review mass flows, stocks, environmental releases, PECs, closure, and visualizations.',when:'Use after a successful model run.',inputs:'No additional inputs; results reflect the current scenario.',caution:'A 100% mass balance verifies accounting, not empirical prediction accuracy.'},
 mixtureStatus:{title:'Multi-material and co-exposure assessment',chapter:'11. Multi-material and co-exposure',page:31,purpose:'Run multiple material components and summarize co-occurrence, HQ, HI, and optional interaction adjustments.',when:'Use for formulations or co-exposure questions.',inputs:'Components, formulation, exposure metrics, thresholds, and interaction evidence.',caution:'Mechanistic intermaterial fate interactions are not automatically simulated.'},
 advancedIntro:{title:'Expert tools',chapter:'12. Expert tools',page:33,purpose:'Access trade, stock-driven dynamic MFA, reconciliation, calibration, validation, and burden indicators.',when:'Use only when the research question and data support the selected expert method.',inputs:'Method-specific observations, constraints, priors, or targets.',caution:'Expert tools do not compensate for weak or incompatible input evidence.'}
};
let reportCache=null, autosaveTimer=null, helpTimer=null, lastSerialized='', restoring=false;
function app(){return window.KNanoApp;}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function sum(arr,key){return (arr||[]).reduce((a,x)=>a+Number(key?x?.[key]:x||0),0);}
function feature(id){return window.KNanoUIv21?.FEATURES?.find(f=>f.id===id);}
function go(id){const f=feature(id);if(f)window.KNanoUIv21.navigate(f);}
function issue(message,stage,featureId,severity='error'){return {message,stage,featureId,severity};}
function classifyError(message){
 const m=String(message).toLowerCase();
 if(m.includes('product-inventory')||m.includes('product input')||m.includes('nano-enabled')||m.includes('primary quantity'))return ['inventory','product-inventory'];
 if(m.includes('allocation')||m.includes('product share'))return ['inventory','product-categories'];
 if(m.includes('end-of-life')||m.includes('eol')||m.includes('reuse')||m.includes('recycling'))return ['inventory','eol'];
 if(m.includes('lifetime')||m.includes('weibull'))return ['inventory','lifetime'];
 if(m.includes('trajectory')||m.includes('horizon')||m.includes('start year')||m.includes('end year'))return ['scope','dynamic-trajectory'];
 if(m.includes('release-form'))return ['release','release-forms'];
 if(m.includes('nanoform'))return ['release','nanoform'];
 if(m.includes('tracking basis')||m.includes('dynamic fate')||m.includes('solver')||m.includes('storm')||m.includes('kinetic'))return ['release','dynamic-fate'];
 if(m.includes('water')||m.includes('soil')||m.includes('sediment')||m.includes('mixing height')||m.includes('environment'))return ['release','pec-settings'];
 if(m.includes('wwtp')||m.includes('incineration')||m.includes('landfill')||m.includes('sludge'))return ['release','treatment'];
 if(m.includes('geograph')||m.includes('country')||m.includes('region'))return ['scope','geography'];
 if(m.includes('custom material'))return ['scope','custom-material'];
 return ['scope','model-mode'];
}
function buildReport(){
 const A=app();if(!A)return null;
 const issues=[];
 let errors=[];try{errors=A.validate()||[];}catch(e){errors=[e.message];}
 errors.forEach(msg=>{const [stage,fid]=classifyError(msg);issues.push(issue(msg,stage,fid,'error'));});
 const st=A.state;
 if(!String(A.materialDisplayName?.()||'').trim())issues.push(issue('Select a target nanomaterial.','scope','material','error'));
 if(!(A.geographicScale?.()>0))issues.push(issue('Select a valid geographic domain and allocation basis.','scope','geography','error'));
 if(A.isCustomMaterial?.()){
   if(!String(st.customMaterial?.source||'').trim())issues.push(issue('Add a primary source or reference for the custom material.','scope','custom-material','warning'));
   if(!String(st.customMaterial?.note||'').trim())issues.push(issue('Document custom-material limitations.','scope','custom-material','warning'));
 }
 const alloc=sum(st.products,'allocation_pct');if(Math.abs(alloc-100)>0.05)issues.push(issue(`Product allocation totals ${alloc.toFixed(3)}%, not 100%.`,'inventory','product-categories','error'));
 const eol=sum(st.eol,'fraction_pct');if(st.eol?.length&&Math.abs(eol-100)>0.05)issues.push(issue(`End-of-life routing totals ${eol.toFixed(3)}%, not 100%.`,'inventory','eol','error'));
 if(!String(st.metadata?.study_title||'').trim())issues.push(issue('Add a study title before preparing a reproducibility package.','evidence','model-specification','warning'));
 if(!String(st.metadata?.purpose||'').trim())issues.push(issue('Record the assessment purpose and decision context.','evidence','model-specification','warning'));
 if(!st.result)issues.push(issue('Run the model to generate results.','results','results','incomplete'));
 const byStage={};STAGES.forEach(s=>byStage[s.id]=[]);issues.forEach(x=>(byStage[x.stage]??=[]).push(x));
 const stages=STAGES.map(s=>{
   const arr=byStage[s.id]||[];const blocking=arr.filter(x=>x.severity==='error').length;const warnings=arr.filter(x=>x.severity==='warning').length;
   let status='ready',detail='Ready';
   if(s.id==='results'&&st.result){status='calculated';detail='Calculated';}
   else if(s.id==='expert'){status='optional';detail='Optional';}
   else if(blocking){status='incomplete';detail=`${blocking} blocking`;}
   else if(warnings){status='warning';detail=`${warnings} recommended`;}
   else if(s.id==='results'){status='incomplete';detail='Run required';}
   return {...s,status,detail,issues:arr};
 });
 const blocking=issues.filter(x=>x.severity==='error').length,warnings=issues.filter(x=>x.severity==='warning').length;
 return {issues,stages,blocking,warnings,ready:blocking===0};
}
function renderReadiness(){
 const r=buildReport();if(!r)return;reportCache=r;
 const holder=$('readinessStageList');if(holder){holder.innerHTML=r.stages.map(s=>`<button class="readiness-stage readiness-${s.status}" data-readiness-stage="${s.id}"><span class="readiness-dot"></span><b>${esc(s.label)}</b><small>${esc(s.detail)}</small></button>`).join('');holder.querySelectorAll('[data-readiness-stage]').forEach(b=>b.onclick=()=>{const s=r.stages.find(x=>x.id===b.dataset.readinessStage);const target=s?.issues[0]?.featureId||s?.feature;go(target);});}
 const overall=$('readinessOverall');if(overall){overall.className=`readiness-overall ${r.ready?'ready':'attention'}`;overall.textContent=r.ready?(r.warnings?`Ready · ${r.warnings} checks`:'Ready to run'):`${r.blocking} blocking`;}
 document.querySelectorAll('.workflow-step').forEach(b=>{const s=r.stages.find(x=>x.id===b.dataset.guideStage);if(!s)return;b.dataset.readiness=s.status;let badge=b.querySelector('.workflow-readiness');if(!badge){badge=document.createElement('em');badge.className='workflow-readiness';b.append(badge);}badge.textContent=s.detail;});
}
function openOverlay(id){const el=$(id);if(!el)return;el.hidden=false;document.body.classList.add('utility-open');}
function closeOverlay(id){const el=$(id);if(!el)return;el.hidden=true;if(!document.querySelector('.utility-overlay:not([hidden])'))document.body.classList.remove('utility-open');}
function openReadiness(){
 const r=buildReport();reportCache=r;
 $('readinessSummary').innerHTML=`<div class="readiness-summary-card ${r.ready?'ready':'attention'}"><b>${r.ready?'Inputs are calculation-ready':'Resolve blocking inputs before calculation'}</b><span>${r.blocking} blocking issue(s) · ${r.warnings} recommended check(s)</span></div>`;
 const list=$('readinessIssueList');
 const relevant=r.issues.filter(x=>x.severity!=='incomplete'||x.stage==='results');
 list.innerHTML=relevant.length?relevant.map((x,i)=>`<div class="readiness-issue issue-${x.severity}"><span>${x.severity==='error'?'!':x.severity==='warning'?'△':'○'}</span><div><b>${esc(STAGES.find(s=>s.id===x.stage)?.label||x.stage)}</b><p>${esc(x.message)}</p></div><button class="ghost compact-action" data-issue-index="${i}">Go to input</button></div>`).join(''):'<div class="notice">No blocking or recommended issues were detected. Review scientific assumptions before running.</div>';
 list.querySelectorAll('[data-issue-index]').forEach(b=>b.onclick=()=>{const x=relevant[Number(b.dataset.issueIndex)];closeOverlay('readinessOverlay');go(x.featureId);});
 openOverlay('readinessOverlay');
}
function installHelp(){
 Object.entries(HELP).forEach(([id,h])=>{const panel=$(id);if(!panel)return;let host=panel.querySelector('.section-title')||panel.querySelector('h2')?.parentElement||panel;if(host.querySelector('.context-help-button'))return;const b=document.createElement('button');b.type='button';b.className='ghost compact-action context-help-button';b.setAttribute('aria-label',`Help for ${h.title}`);b.textContent='? Help';b.onclick=e=>{e.preventDefault();e.stopPropagation();showHelp(id);};if(host.classList.contains('section-title'))host.append(b);else panel.insertBefore(b,panel.firstChild);});
}
function showHelp(id){const h=HELP[id];if(!h)return;$('contextHelpTitle').textContent=h.title;$('contextHelpBody').innerHTML=`<div class="help-chapter">Manual: ${esc(h.chapter)}</div><h3>Purpose</h3><p>${esc(h.purpose)}</p><h3>When to use</h3><p>${esc(h.when)}</p><h3>Required inputs</h3><p>${esc(h.inputs)}</p><h3>Interpretation caution</h3><p>${esc(h.caution)}</p>`;const link=$('contextHelpOverlay').querySelector('a.button');link.href='USER_GUIDE_v2.5.1.html';openOverlay('contextHelpOverlay');}
function snapshotSummary(s){return `${s.material_display_name||s.material||'Material'} · ${s.country_code||''}/${s.domain_id||s.region||''} · ${String(s.mode||'').replaceAll('_',' ')}`;}
function loadSnapshots(){try{const v=JSON.parse(localStorage.getItem(AUTOSAVE_KEY)||'[]');return Array.isArray(v)?v:[];}catch(_){return [];}}
function saveSnapshots(rows){try{localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(rows));return true;}catch(_){return false;}}
function autosave(reason='change'){
 if(restoring||!app()?.scenario)return;
 try{const scenario=app().scenario();scenario.version='2.5.1-en';const serialized=JSON.stringify(scenario);if(serialized===lastSerialized)return;lastSerialized=serialized;const rows=loadSnapshots();rows.unshift({id:`${Date.now()}`,saved_at:new Date().toISOString(),reason,summary:snapshotSummary(scenario),scenario});const unique=[];const seen=new Set();for(const x of rows){const key=JSON.stringify(x.scenario);if(seen.has(key))continue;seen.add(key);unique.push(x);if(unique.length>=MAX_SNAPSHOTS)break;}if(saveSnapshots(unique)){const el=$('autosaveStatus');if(el)el.textContent=`Autosaved ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · ${unique.length} recovery snapshot(s)`;}}catch(e){const el=$('autosaveStatus');if(el)el.textContent='Autosave unavailable; export the scenario Excel workbook for safety.';}
}
function scheduleAutosave(){clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>autosave('edited'),1800);}
function renderRecovery(){const rows=loadSnapshots(),holder=$('recoveryList');holder.innerHTML=rows.length?rows.map((x,i)=>`<div class="recovery-row"><div><b>${esc(x.summary)}</b><span>${new Date(x.saved_at).toLocaleString()} · ${esc(x.reason)}</span></div><button class="primary compact-action" data-restore-index="${i}">Restore</button></div>`).join(''):'<div class="notice">No autosave snapshots are available in this browser.</div>';holder.querySelectorAll('[data-restore-index]').forEach(b=>b.onclick=()=>{const x=rows[Number(b.dataset.restoreIndex)];if(!x||!confirm('Restore this autosave and replace the current on-screen scenario?'))return;restoring=true;try{app().applyScenario(x.scenario,false);lastSerialized=JSON.stringify(app().scenario());closeOverlay('recoveryOverlay');renderReadiness();$('autosaveStatus').textContent=`Restored autosave from ${new Date(x.saved_at).toLocaleString()}`;}finally{restoring=false;}});}
function openRecovery(){renderRecovery();openOverlay('recoveryOverlay');}
function sampleScenario(kind){
 const A=app();if(!A)return;let s=A.scenario();s.version='2.5.1-en';s.mode='static_deterministic';
 if(s.product_inventory)s.product_inventory.input_mode='direct_enm';if(s.nanoform)s.nanoform.enabled=false;if(s.dynamic_fate)s.dynamic_fate.enabled=false;
 if(kind==='product'){
   const pi=JSON.parse(JSON.stringify(s.product_inventory||{input_mode:'product_inventory',rows:[]}));pi.input_mode='product_inventory';pi.rows=(pi.rows||[]).map(r=>{const q=Math.max(0,Number(r.primary_quantity)||0);return {...r,input_basis:'product_mass',primary_quantity:q/0.01,conversion_factor:1,enm_content_wt_pct:1,nano_enabled_pct:100,evidence_class:'E',source_note:'v2.5.1 transparent product-informed example; replace with project-specific market and composition data.'};});s.product_inventory=pi;
 }
 if(kind==='nanoform'){
   const nf=window.KNanoNanoform?.defaultState?.()||s.nanoform||{};nf.enabled=true;nf.material_preset=window.KNanoReliability.MATERIALS[A.materialDisplayName()]?.preset||'custom';nf.embedding_preset='surface_coating';const mp=window.KNanoNanoform.MATERIAL_PRESETS[nf.material_preset];for(const medium of Object.keys(nf.medium_splits))nf.medium_splits[medium]={free_within_free_agg_pct:mp.free[medium],dissolved_within_transformed_pct:mp.dissolved[medium]};s.nanoform=nf;
   const df=window.KNanoDynamicFate?.defaultState?.()||s.dynamic_fate||{};df.enabled=true;df.numerical_solver='exact_linear';df.tracking_basis='selected_material_equivalent';df.preset=window.KNanoReliability.MATERIALS[A.materialDisplayName()]?.preset||'custom';df.rates=JSON.parse(JSON.stringify(window.KNanoDynamicFate.PRESETS[df.preset].rates));s.dynamic_fate=df;
 }
 if(!confirm('Load this example and replace the current on-screen scenario?'))return;restoring=true;try{A.applyScenario(s,false);if(kind==='product')document.querySelector('#marketInputMode')?.dispatchEvent(new Event('change',{bubbles:true}));renderReadiness();autosave(`example: ${kind}`);closeOverlay('assistantOverlay');if(kind==='product')go('product-inventory');else if(kind==='nanoform')go('dynamic-fate');else go('model-mode');}finally{restoring=false;}
}
function bind(){
 $('reviewReadinessBtn')?.addEventListener('click',openReadiness);$('reviewBeforeRunBtn')?.addEventListener('click',openReadiness);
 $('closeReadinessBtn')?.addEventListener('click',()=>closeOverlay('readinessOverlay'));
 $('openRecoveryBtn')?.addEventListener('click',openRecovery);$('closeRecoveryBtn')?.addEventListener('click',()=>closeOverlay('recoveryOverlay'));
 $('clearRecoveryBtn')?.addEventListener('click',()=>{if(confirm('Clear all browser autosave snapshots?')){saveSnapshots([]);renderRecovery();$('autosaveStatus').textContent='Autosave history cleared.';}});
 $('closeContextHelpBtn')?.addEventListener('click',()=>closeOverlay('contextHelpOverlay'));
 $('startAssistantBtn')?.addEventListener('click',()=>openOverlay('assistantOverlay'));$('closeAssistantBtn')?.addEventListener('click',()=>closeOverlay('assistantOverlay'));
 document.querySelectorAll('[data-sample]').forEach(b=>b.addEventListener('click',()=>sampleScenario(b.dataset.sample)));
 document.querySelectorAll('.utility-overlay').forEach(x=>x.addEventListener('click',e=>{if(e.target===x)closeOverlay(x.id);}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.utility-overlay:not([hidden])').forEach(x=>closeOverlay(x.id));});
 document.addEventListener('input',()=>{scheduleAutosave();setTimeout(renderReadiness,80);},true);document.addEventListener('change',()=>{scheduleAutosave();setTimeout(renderReadiness,80);},true);
 $('calculateBtn')?.addEventListener('click',()=>setTimeout(()=>{renderReadiness();autosave('model run');},200));
}
function init(){if(!app()){setTimeout(init,100);return;}const content=document.querySelector('.content'),footer=document.querySelector('.site-footer');if(footer&&content&&footer.parentElement!==content)content.appendChild(footer);installHelp();if(content){new MutationObserver(()=>{clearTimeout(helpTimer);helpTimer=setTimeout(installHelp,120);}).observe(content,{childList:true,subtree:true});}bind();renderReadiness();const rows=loadSnapshots();if(rows.length){lastSerialized=JSON.stringify(rows[0].scenario);$('autosaveStatus').textContent=`${rows.length} recovery snapshot(s) available.`;}setTimeout(()=>autosave('session opened'),1200);setInterval(()=>autosave('periodic'),30000);}
document.addEventListener('DOMContentLoaded',init);
window.KNanoUIv211={buildReport,renderReadiness,openReadiness,openRecovery,showHelp,autosave,sampleScenario};
})();
