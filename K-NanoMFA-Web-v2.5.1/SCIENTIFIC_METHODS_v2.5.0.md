# K-NanoMFA v2.5.0 — calculation methods and scientific boundary

## 1. What a PEC represents

A predicted environmental concentration is tracked mass divided by an explicitly defined environmental capacity. The base MFA dilution/residence calculation, reduced four-compartment fate calculation, and 28-state fate calculation are different models. They should be identified separately in reporting. Outputs are spatial domain averages. They do not resolve near-source plumes, within-river gradients, sediment heterogeneity or background natural metal concentrations.

The 28 states are four media × seven operational forms: matrix-bound, free particle, small aggregate, large aggregate, dissolved, transformed particle and unresolved. “Particulate” in the observation tool sums the five identified particle-containing forms. It excludes dissolved and unresolved mass. It is not a universal operational definition of a measured particle fraction.

## 2. Tracked mass

Market inflow is entered as selected parent-material mass. The fate module can track that parent-material-equivalent mass or a specified constituent element. For pure ZnO, f(Zn)=65.38/(65.38+15.999)=0.8034 approximately. Element-equivalent input is f × parent input. The same factor is applied to internally generated releases and their immediate external outflows. Imported inventories declare their basis and are converted before simulation. Initial environmental stocks are entered on the selected output basis. Changing the mass-basis selector or the custom elemental fraction now converts existing initial stocks by the new/old elemental factor. A conversion log is retained. Imported scenarios already declare their stock basis and are not converted a second time.

Parent-equivalent mass is a bookkeeping basis. It is not the actual mass of a newly formed sulfide, precipitate, coating or aggregate. Transformation conserves the tracked equivalent through state transfers. Named external sinks are outside the active model boundary and remain in the mass balance; they do not mean elemental mass ceases to exist. Nanoclay, nanocellulose, mixed compositions and coated particles require documented composition for element-equivalent conversion. Built-in metal/oxide fractions assume the stated pure compound. A custom fraction overrides that assumption.

## 3. Coupled environmental balance

For constant annual input u, x′=Kx+u. Off-diagonal terms of K represent transfers into a state. Its diagonal contains all losses from that state. Both fate engines use an augmented matrix exponential to advance stocks and integrate stock occupancy. Internal transfer fluxes and external outflows are rate × integrated occupancy. No inverse of K is needed, including conservative cases.

For the full simulation:

initial stock + cumulative input = final active stock + cumulative external outflow.

The numerical implementation uses scaled Taylor actions of the exponential. “Exact linear” denotes the solution formulation; floating-point evaluation still has a tolerance. A legacy substep solver remains only as an explicit comparison option in the 28-state module. It does not produce annual-mean concentrations. Zero and very small positive stocks are preserved.

Annual-mean dynamic concentrations use the integrated stock over that year divided by one year and by capacity. Year-end concentrations use the closing stock. Storm fractions are applied as discrete transfers at year end. They affect closing stock and subsequent years. They do not alter the preceding annual mean. Empty event years apply the pulse every dynamic year. Transfers are simultaneous using pre-event stocks; material arriving in sediment is not re-resuspended during the same event. Shared soil fractions must sum to at most 100%. All storm pulses are blocked in steady mode. This is not an intra-annual rainfall-runoff model.

Steady-state output requires each state to satisfy both stock-change and flow-residual tolerances (default relative 1e-7 plus absolute 1e-14 kg or kg/year). Forced states with no path to an external sink prevent convergence. Large inert stocks cannot hide accumulation in another state. Conservative unforced initial inventories may remain constant; this does not establish a unique globally attracting equilibrium. Spin-up cumulative sinks and steady annual sinks are separate. An unconverged result must not be compared as steady state. For dynamic calculations, missing years are rejected unless explicit zero-fill is selected. A single imported annual row defaults to a one-year dynamic calculation. Steady input requires an explicit selection and exactly one annual profile.

## 4. Environmental capacities and physical rates

Water volume V=Q×86400×tau_days. Default k_adv=365.25/tau_days per year for particulate and dissolved forms. Thus a conservative well-mixed box at steady state has C=u/(Q×seconds_per_year), independent of tau. A custom advection rate is possible but breaks this hydraulic identity unless justified. Doubling Q with fixed tau changes volume and dilution; it does not change 1/tau.

Air capacity is area × mixing height. Soil and sediment capacity are receiving area × mixing depth × dry bulk density. National or administrative-domain areas are not automatically the true receiving area. Korean subnational default river flow is a wastewater-flow-derived proxy (factor 10 in the bundled dataset), not a measured river discharge. Default receiving soil and sediment areas also require replacement for site work.

The optional physical-rate panel calculates sphere settling as v=max(rho_p-rho_w,0)gd²/(18mu), then k_settle=v/H. Particle Reynolds number must be ≤0.1. The model uses user-supplied effective diameters and density. It does not estimate fractal aggregate density, hindered settling, nonspherical drag or buoyant rise. A floating particle receives zero downward settling, not a simulated upward transport velocity. For CNT and other nonspherical materials, documented empirical rates are generally needed.

The optional pseudo-first-order aggregation rate is k_agg=alpha×beta×N_bg. N_bg is an imposed constant background particle number concentration; beta is the supplied collision kernel. This is not a concentration-dependent population balance. Other reaction and transfer rates remain empirical first-order inputs. Presets are screening assumptions, not measured universal constants. Dissolution is not computed from pH, ligands, ionic strength or saturation. No claim of equilibrium speciation is made. Rate-specific source notes and a structured evidence register are preserved with the scenario. The register checks material, domain, units, applicability range, period and conditions. It does not verify source authenticity. Receiving areas and hydrology are user-editable; no unprovided local measurements have been invented.

## 5. Product lifetime and use emissions

Let S(a) be Weibull survival, U the total potential use-release fraction, and d the use-release duration. The remaining material fraction in an in-use cohort is A(a)=S(a)[1−U min(a/d,1)]. During age a to a+1, use release is U/d times the integral of S(t) up to d. Retirement receives A(a)−A(a+1)−use release. The closing in-use stock is A(a+1). This prevents scheduled use emissions after retirement. It assumes a uniform potential use-release rate during d among surviving products. It does not model age-dependent abrasion beyond this assumption.

For base soil/sediment accumulation with constant annual input I and residence tau, the annual input contribution is I×tau×[1−exp(−1/tau)]. This includes loss during the year of input. Base water and air PECs remain annual dilution/ventilation screening quantities. Base soil/sediment dynamic PECs are year-end stocks; their static counterparts use steady residence-time assumptions.

## 6. Observation matching

Every observation supplies material, domain, prediction source, medium, measured form, mass basis, year, time statistic, unit, data role and source/method note. Numerical prediction is converted to the observation's mass basis and a canonical concentration unit. Soil/sediment/sludge observations require dry-weight units. No wet-to-dry conversion is guessed. Unmatched years and domains, unknown forms, unavailable predictions, duplicates and censored measurements are excluded with a reason. No last-year substitution is used.

RMSE and bias are grouped by comparable source/medium/form/basis/statistic/data-role endpoints. Positive-only comparisons also report log10 RMSE, geometric bias and factor-2/factor-10 coverage. Zero observations are retained for linear statistics, but omitted for logarithmic statistics. Qualification requires dataset ID, analytical method, representative sampling period, background treatment, engineered-material scope and an independence declaration. Calibration dataset IDs prevent counting the same dataset as independent validation. Missing metadata leaves a diagnostic comparison but disqualifies its independent-validation count. These labels are still user assertions. The program cannot establish independence or analytical method comparability from those labels. A measured total element concentration that contains background natural metal does not automatically validate an engineered-material-only prediction.

Literature benchmarks are contextual comparisons. Their applicability scores and numerical range agreement are not validation probabilities. The bundled benchmark library was retained; no new field measurements were invented. Selecting the 28-state source compares its total equivalent burden, which can differ from a paper's particle-specific measurand.

## 7. Conditional uncertainty

Kinetic-only mode varies rates. Linked mode also varies market scale, allocation/use/treatment/EoL parameters, lifetimes, form allocation and environmental capacities. Inputs are sampled with the program's lognormal/composition models, preserving structural zero fractions. Shared market-scale uncertainty does not represent independent product-market datasets. Imported external inventories retain their supplied form shares and receive a shared mass multiplier. Hydraulic rates are recalculated from residence time. Physical derived rates are recalculated from sampled primitive inputs. One shared size multiplier preserves the ordering of the three representative diameters. This assumes perfectly correlated diameter-scale uncertainty. Per-rate CV values in the evidence register override the common kinetic CV.

Rate dependence uses a shared group component plus a parameter-specific component. This is an assumed correlation structure; it is not inferred from measurements. Initial stocks, all possible dependencies, model structural alternatives, background concentrations and measurement error are not fully sampled. Stock-driven linked fate uncertainty is blocked; base stock-driven uncertainty remains available separately.

P5, P50 and P95 describe conditional simulation distributions. P5–P95 spans 90%, not 95%. Half-sample/full-sample quantile change is a stability diagnostic, not a certification of convergence. The new panel repeats multiple counts and seeds, compares P5/P50/P95 changes and the maximum-count seed spread against a user-selected threshold. Local ±20% sensitivity recomputes physical rates and capacities while holding upstream emissions fixed; it is not global Sobol sensitivity. Increase iterations and compare seeds for a study-specific sampling check. A nonconverged steady-state uncertainty draw blocks interval reporting; increase the spin-up horizon or review model retention before rerunning. Independent observations and an appropriate structural model are needed before making claims about predictive accuracy.

## 8. Evidence required for interpretation

Record actual receiving-water discharge and geometry; define the particle or element measurand; document input mass and temporal boundary; replace relevant kinetic assumptions with evidence; compare with independently measured matching endpoints. Passing code tests establishes numerical and software behavior within the tests. It does not establish environmental predictive validity.

The supplied SOURCES.md identifies the inherited data/method literature. It is not a one-to-one empirical source for every rate in a preset. The equations above state the implemented assumptions directly.
