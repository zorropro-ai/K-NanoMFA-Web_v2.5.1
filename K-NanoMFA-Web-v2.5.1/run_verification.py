from pathlib import Path
import subprocess,json,os,time
p=Path(__file__).parent
results=[]
for f in sorted(p.glob('test_*.js')):
 if 'dom' in f.name:continue
 t=time.time();r=subprocess.run(['node',str(f)],cwd=p,capture_output=True,text=True)
 results.append(dict(test=f.name,passed=r.returncode==0,seconds=round(time.time()-t,3),output=r.stdout,error=r.stderr))
 print(f.name,r.returncode,flush=True)
(p/'TEST_RESULTS_v2.5.0.json').write_text(json.dumps(results,indent=2))
assert all(r['passed'] for r in results)
