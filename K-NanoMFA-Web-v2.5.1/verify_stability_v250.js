const fs=require('fs'),F=require('./dynamic_fate'),H=require('./research_core'),D=require('./data');
(async()=>{
const region=D.REGION_DATA.find(x=>x.domain_id==='KR-national'),ctx={material:'AgNP',region,baseYear:2025,environment:{river_flow_m3_s:100,soil_area_ha:1000,soil_depth_m:.2,soil_bulk_density_kg_m3:1300,sediment_area_km2:1,sediment_depth_m:.05,sediment_bulk_density_kg_m3:1300,air_mixing_height_m:1000}};
const cfg=F.defaultState();cfg.enabled=true;cfg.external_coupling.enabled=true;cfg.external_coupling.rows=[2025,2026,2027].flatMap(year=>F.COMPARTMENTS.map(compartment=>({year,compartment,form:'free_particle',mass_kg_y:1,tracking_basis:'selected_material_equivalent',material:ctx.material,domain_id:region.domain_id})));
cfg.uncertainty={...cfg.uncertainty,enabled:true,mode:'linked'};
const report={scenario:'Synthetic three-year Ag forcing of 1 kg/year into each medium; not field observations',context:ctx,config:cfg};
report.repeatability=await H.stability({model:'static'},null,ctx,cfg,{counts:[500,1000,2000,5000],seeds:[73,173,273],threshold:.1},p=>console.log('repeatability',p.completed,p.total));
report.correlation=[];
for(const [group,within]of [[0,0],[.3,.5],[.8,.9]]){const c=JSON.parse(JSON.stringify(cfg));c.uncertainty.iterations=2000;c.uncertainty.group_correlation=group;c.uncertainty.within_group_correlation=within;const u=await F.runUncertaintyAsync({model:'static'},null,ctx,c);report.correlation.push({group,within,summary:u.summary});console.log('correlation',group,within)}
report.sensitivity=H.sensitivity({model:'static'},null,ctx,cfg);
fs.writeFileSync('UNCERTAINTY_VERIFICATION_v2.5.0.json',JSON.stringify(report,null,2));console.log('done',report.repeatability.passed);
})().catch(e=>{console.error(e);process.exit(1)});
