(()=>{
'use strict';
const $=id=>document.getElementById(id);
const FEATURES=[
 {id:'model-mode',name:'Static or dynamic model mode',category:'Study setup',tab:'model',target:'modelModePanel',keywords:'temporal deterministic probabilistic cohort mode'},
 {id:'material',name:'Select a bundled nanomaterial',category:'Study setup',tab:'model',target:'materialSelect',keywords:'material CNT graphene titanium dioxide zinc oxide silver'},
 {id:'custom-material',name:'Create a custom nanomaterial',category:'Study setup',tab:'model',target:'customMaterialPanel',keywords:'custom material composition coating behavior proxy evidence'},
 {id:'custom-country',name:'Create a custom country or subnational domain',category:'Study setup',tab:'model',target:'customGeoPanel',keywords:'country region geography custom domain national subnational'},
 {id:'input-basis',name:'Select geographic basis for market inflow',category:'Study setup',tab:'model',target:'inputBasis',keywords:'population sewer wastewater regional scaling allocation'},
 {id:'dynamic-trajectory',name:'Define the dynamic horizon and input trajectory',category:'Study setup',tab:'model',target:'dynamicTrajectoryPanel',keywords:'start year end year growth annual trajectory cohort'},
 {id:'product-inventory',name:'Product-informed ENM inventory',category:'Product inventory',tab:'lifecycle',target:'productInventoryPanel',keywords:'product mass content nano-enabled unit sales area volume concentration'},
 {id:'product-categories',name:'Product categories and use-stage release',category:'Product inventory',tab:'lifecycle',target:'productCategoryPanel',keywords:'allocation category release air water soil WWTP'},
 {id:'lifetime',name:'Product lifetime and delayed release',category:'Product inventory',tab:'lifecycle',target:'lifetimePanel',keywords:'weibull lifetime cohort stock delay'},
 {id:'eol',name:'End-of-life routes',category:'Product inventory',tab:'lifecycle',target:'eolPanel',keywords:'incineration landfill recycling reuse biological treatment'},
 {id:'treatment',name:'Treatment-process transfer coefficients',category:'Release & fate',tab:'treatment',target:'treatmentCoefficientPanel',keywords:'WWTP incineration landfill recycling sludge coefficient'},
 {id:'geography',name:'Geographic-domain data',category:'Release & fate',tab:'environment',target:'geographyDataPanel',keywords:'population area wastewater sludge river flow'},
 {id:'pec-settings',name:'Environmental-media PEC settings',category:'Release & fate',tab:'environment',target:'pecSettingsPanel',keywords:'water soil sediment air capacity residence depth density mixing height'},
 {id:'release-forms',name:'Nanoform-resolved environmental releases',category:'Release & fate',tab:'fate',target:'releaseFormPanel',keywords:'free aggregate matrix transformed dissolved unknown release form'},
 {id:'nanoform',name:'Nanoform-resolved mass accounting',category:'Release & fate',tab:'fate',target:'nanoformPanel',keywords:'matrix bound free particle aggregate dissolved transformed state'},
 {id:'dynamic-fate',name:'Dynamic nanoform environmental fate',category:'Release & fate',tab:'fate',target:'dynamicFatePanel',keywords:'dissolution aggregation settling resuspension storm kinetic exact solver'},
 {id:'tracking-basis',name:'Dynamic-fate tracked material basis',category:'Release & fate',tab:'fate',target:'dynamicFateTrackingBasis',keywords:'constituent element pristine transformed solid composite basis'},
 {id:'external-coupling',name:'Import state-resolved environmental inflow CSV',category:'Release & fate',tab:'fate',target:'dynamicFateExternalEnabled',keywords:'external coupling CSV environmental inflow unit source'},
 {id:'model-specification',name:'MFA system definition and reporting metadata',category:'Evidence & uncertainty',tab:'quality',target:'modelSpecificationPanel',keywords:'boundary accounting study title tracking basis metadata'},
 {id:'provenance',name:'Default-data provenance register',category:'Evidence & uncertainty',tab:'quality',target:'provenanceTable',keywords:'source DOI evidence class provenance'},
 {id:'benchmark',name:'External literature benchmarking',category:'Evidence & uncertainty',tab:'quality',target:'benchmarkPanel',keywords:'benchmark literature applicability concordance plausibility compare'},
 {id:'quality',name:'Data-quality matrix and group uncertainty',category:'Evidence & uncertainty',tab:'quality',target:'qualityMatrixPanel',keywords:'quality score CV pedigree uncertainty evidence'},
 {id:'sensitivity',name:'Mass-conserving sensitivity analysis',category:'Evidence & uncertainty',tab:'quality',target:'sensitivityPanel',keywords:'sensitivity perturbation parameter rank influence'},
 {id:'monte-carlo',name:'Probabilistic Monte Carlo simulation',category:'Evidence & uncertainty',tab:'uncertainty',target:'probabilisticPanel',keywords:'P5 P50 P95 Monte Carlo uncertainty distribution'},
 {id:'results',name:'Main MFA results and Sankey diagram',category:'Results & mixtures',tab:'results',target:'resultsArea',keywords:'result flow stock release PEC Sankey outflow'},
 {id:'nanoform-results',name:'Nanoform-state results',category:'Results & mixtures',tab:'results',target:'nanoformResultsPanel',keywords:'state inventory state-specific PEC'},
 {id:'fate-results',name:'Dynamic nanoform-fate results',category:'Results & mixtures',tab:'results',target:'dynamicFateResultsPanel',keywords:'kinetic fate stock matrix outflow annual PEC'},
 {id:'comparison',name:'Compare stored scenarios',category:'Results & mixtures',tab:'results',target:'scenarioComparisonPanel',keywords:'comparison runs scenario chart'},
 {id:'mixture',name:'Multi-material and co-exposure assessment',category:'Results & mixtures',tab:'mixture',target:'mixtureStatus',keywords:'mixture formulation component co-exposure HQ HI interaction'},
 {id:'trade',name:'International trade and apparent consumption',category:'Expert tools',tab:'advanced',target:'tradePanel',keywords:'import export bilateral apparent consumption'},
 {id:'stock-driven',name:'Stock-driven dynamic MFA',category:'Expert tools',tab:'advanced',target:'stockDrivenPanel',keywords:'inverse stock driven target cohort'},
 {id:'reconciliation',name:'Constrained data reconciliation',category:'Expert tools',tab:'advanced',target:'reconciliationPanel',keywords:'reconcile constraint balance observation'},
 {id:'calibration',name:'Bayesian calibration',category:'Expert tools',tab:'advanced',target:'calibrationPanel',keywords:'Bayesian posterior observed result calibration'},
 {id:'reduced-fate',name:'Reduced-form multimedia fate',category:'Expert tools',tab:'advanced',target:'reducedFatePanel',keywords:'four compartment multimedia transfer rate'},
 {id:'validation',name:'Independent validation dataset',category:'Expert tools',tab:'advanced',target:'validationPanel',keywords:'validation measured observed RMSE statistics'},
 {id:'burden',name:'Screening life-cycle burden indicator',category:'Expert tools',tab:'advanced',target:'burdenPanel',keywords:'LCA climate burden energy emission'},
 {id:'methods',name:'Methods, equations, and limitations',category:'Expert tools',tab:'method',target:'tab-method',keywords:'method equation interpretation boundary limitation license'}
];
const ROUTES={
 standard:{title:'Standard MFA',steps:['model-mode','product-categories','treatment','pec-settings','results']},
 product:{title:'Product-informed inventory',steps:['product-inventory','product-categories','lifetime','treatment','results']},
 nanoform:{title:'Nanoform and dynamic fate',steps:['release-forms','nanoform','dynamic-fate','fate-results']},
 mixture:{title:'Multi-material / co-exposure',steps:['mixture']},
 validation:{title:'Calibration and validation',steps:['model-specification','benchmark','calibration','validation']},
 custom:{title:'Custom material or country',steps:['custom-material','custom-country']}
};
let currentQuery='';
function normalize(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function matches(f,q){if(!q)return true;const tokens=normalize(q).split(/\s+/).filter(Boolean);const hay=normalize(`${f.name} ${f.category} ${f.keywords}`);return tokens.every(t=>hay.includes(t));}
function featureById(id){return FEATURES.find(f=>f.id===id);}
function openAncestorDetails(el){let n=el;while(n){if(n.tagName==='DETAILS')n.open=true;n=n.parentElement;}}
function flash(el){el.classList.remove('feature-target-pulse');void el.offsetWidth;el.classList.add('feature-target-pulse');setTimeout(()=>el.classList.remove('feature-target-pulse'),2200);}
function navigate(feature){
 if(!feature)return;
 if(window.KNanoApp?.switchTab)window.KNanoApp.switchTab(feature.tab);
 const special={customGeoPanel:'manageCustomCountryBtn'};
 if(special[feature.target] && $(feature.target)?.hidden)$(special[feature.target])?.click();
 setTimeout(()=>{
   let el=$(feature.target)||document.querySelector(feature.target);
   if(!el)el=$(`tab-${feature.tab}`);
   openAncestorDetails(el);
   if(el.hidden && feature.target==='customMaterialPanel'){
     el=$('materialSelect');
   }
   el?.scrollIntoView({behavior:'smooth',block:'start'}); if(el)flash(el);
   updateLocation(feature.name,feature.category);
 },90);
 closeFinder();
}
function updateLocation(name,category){const el=$('navigatorLocation');if(el)el.innerHTML=`<span>${category||'Current workspace'}</span><b>${name||activeWorkspaceName()}</b>`;}
function activeWorkspaceName(){return document.querySelector('.workspace-tabs .tab.active')?.textContent?.trim()||'Study setup';}
function renderFinder(query=''){
 currentQuery=query; const holder=$('featureFinderResults'); if(!holder)return;
 const found=FEATURES.filter(f=>matches(f,query)); holder.innerHTML='';
 if(!found.length){holder.innerHTML='<div class="feature-empty">No matching function. Try a process name, output, or scientific term.</div>';return;}
 const groups={};found.forEach(f=>(groups[f.category]??=[]).push(f));
 Object.entries(groups).forEach(([category,items])=>{
   const section=document.createElement('section');section.className='feature-result-group';
   const h=document.createElement('h3');h.textContent=category;section.append(h);
   items.forEach(f=>{const b=document.createElement('button');b.className='feature-result';b.dataset.featureId=f.id;b.innerHTML=`<span><b>${f.name}</b><small>${f.category} → ${workspaceLabel(f.tab)}</small></span><i>Open</i>`;b.onclick=()=>navigate(f);section.append(b);});
   holder.append(section);
 });
}
function workspaceLabel(tab){return document.querySelector(`.workspace-tabs .tab[data-tab="${tab}"]`)?.textContent?.trim()||tab;}
function openFinder(query=''){
 const ov=$('featureFinderOverlay');if(!ov)return;ov.hidden=false;ov.setAttribute('aria-hidden','false');document.body.classList.add('feature-finder-open');
 const input=$('featureFinderInput');input.value=query;renderFinder(query);setTimeout(()=>input.focus(),30);
}
function closeFinder(){const ov=$('featureFinderOverlay');if(!ov)return;ov.hidden=true;ov.setAttribute('aria-hidden','true');document.body.classList.remove('feature-finder-open');}
function showRoute(key){
 const route=ROUTES[key]||ROUTES.standard;openFinder('');
 const holder=$('featureFinderResults');holder.innerHTML='';
 const box=document.createElement('section');box.className='route-map';box.innerHTML=`<div class="route-map-title"><span>Quick workflow</span><h3>${route.title}</h3><p>Select a step to open its workspace. The route changes navigation only; it does not overwrite inputs.</p></div>`;
 route.steps.forEach((id,i)=>{const f=featureById(id);if(!f)return;const b=document.createElement('button');b.className='route-step';b.innerHTML=`<span>${i+1}</span><div><b>${f.name}</b><small>${f.category} → ${workspaceLabel(f.tab)}</small></div>`;b.onclick=()=>navigate(f);box.append(b);});
 holder.append(box);$('featureFinderInput').value='';updateLocation(route.title,'Quick workflow');
}
function syncLocation(){const active=document.querySelector('.stage-tab.active')?.textContent?.replace(/^\s*\d+\s*/,'').trim();updateLocation(active||activeWorkspaceName(),'Current task');}
function bind(){
 $('openFeatureFinderBtn')?.addEventListener('click',()=>openFinder());
 $('openFeatureFinderSideBtn')?.addEventListener('click',()=>openFinder());
 $('closeFeatureFinderBtn')?.addEventListener('click',closeFinder);
 $('featureFinderOverlay')?.addEventListener('click',e=>{if(e.target.id==='featureFinderOverlay')closeFinder();});
 $('featureFinderInput')?.addEventListener('input',e=>renderFinder(e.target.value));
 document.querySelectorAll('[data-feature-query]').forEach(b=>b.addEventListener('click',()=>{$('featureFinderInput').value=b.dataset.featureQuery;renderFinder(b.dataset.featureQuery);}));
 const quick=()=>openFinder($('navigatorQuickSearch')?.value||'');
 $('navigatorSearchBtn')?.addEventListener('click',quick);$('navigatorQuickSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')quick();});
 $('applyQuickRouteBtn')?.addEventListener('click',()=>showRoute($('quickRouteSelect')?.value));
 document.querySelectorAll('[data-quick-route]').forEach(b=>b.addEventListener('click',()=>showRoute(b.dataset.quickRoute)));
 document.querySelectorAll('.stage-tab,.workspace-tabs .tab').forEach(b=>b.addEventListener('click',()=>setTimeout(syncLocation,20)));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFinder();if((e.ctrlKey||e.metaKey)&&e.key==='/'){e.preventDefault();openFinder();}});
}
function init(){bind();renderFinder();syncLocation();}
document.addEventListener('DOMContentLoaded',init);
window.KNanoUIv21={FEATURES,ROUTES,openFinder,closeFinder,navigate,showRoute,renderFinder};
})();
