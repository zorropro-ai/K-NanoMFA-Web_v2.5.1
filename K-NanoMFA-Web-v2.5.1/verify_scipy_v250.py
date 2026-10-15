import json
from pathlib import Path
import numpy as np
from scipy.linalg import expm
p=Path(__file__).parent
out=[]
for c in json.loads((p/'solver_cases_v240.json').read_text()):
 n=len(c['rows']);a=np.zeros((2*n+1,2*n+1))
 for i,row in enumerate(c['rows']):
  for j,v in row:a[i,j]+=v
 a[:n,-1]=c['emissions'];a[n:2*n,:n]=np.eye(n)
 ref=expm(a)@np.r_[c['initial'],np.zeros(n),1]
 err=float(np.max(np.abs(np.array(c['js_final'])-ref[:n])))
 occ=float(np.max(np.abs(np.array(c['js_occupancy'])-ref[n:2*n])))
 assert err<1e-8 and occ<1e-8
 out.append(dict(rate_scale=c['scale'],stock_max_abs_error_kg=err,occupancy_max_abs_error_kg_y=occ))
(p/'SCIPY_VERIFICATION_v2.5.0.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
