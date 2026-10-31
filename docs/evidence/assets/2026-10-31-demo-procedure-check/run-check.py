from __future__ import annotations
import base64,json,subprocess,time
from datetime import datetime,timezone,timedelta
from pathlib import Path
from urllib.request import Request,build_opener,ProxyHandler
from urllib.parse import urlencode

root=Path('/tmp/ns7jp-demo-check-20261031')
log=(root/'verification.log').open('w',encoding='utf-8')
results=[]
opener=build_opener(ProxyHandler({}))
compose=[str(root/'compose.sh')]
docker=['env','-u','DOCKER_HOST','-u','DOCKER_CONTEXT','-u','DOCKER_TLS','-u','DOCKER_TLS_VERIFY','-u','DOCKER_CERT_PATH','docker','--host=unix:///var/run/docker.sock']

def note(message):
    line=f'{datetime.now(timezone.utc).isoformat(timespec="seconds")} {message}'
    log.write(line+'\n');log.flush();print(line,flush=True)

def command(args,expected=0):
    note('$ '+' '.join(args))
    r=subprocess.run(args,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=45)
    log.write(r.stdout);log.flush();note(f'exit_code={r.returncode}; expected={expected}')
    assert r.returncode==expected,r.stdout
    return r.stdout

def passed(name,observed):
    results.append({'check':name,'result':'PASS','observed':observed,'utc':datetime.now(timezone.utc).isoformat(timespec='seconds')})
    note(f'PASS {name}: {observed}')

def request(url,payload=None,headers=None):
    data=None if payload is None else json.dumps(payload).encode()
    req=Request(url,data=data,headers=headers or {})
    with opener.open(req,timeout=5) as response:
        return response.status,json.load(response)

def query(expression):
    _,body=request('http://127.0.0.1:19090/api/v1/query?'+urlencode({'query':expression}))
    return [sample['value'][1] for sample in body['data']['result']]

def wait_metric(expression,wanted,timeout=50):
    deadline=time.monotonic()+timeout
    while True:
        try: value=query(expression)
        except Exception as exc: value=[type(exc).__name__]
        if value==[wanted]:
            note(f'Prometheus query={expression}; result={value}')
            return
        if time.monotonic()>=deadline: raise AssertionError(f'{expression}: expected {wanted}, got {value}')
        time.sleep(2)

def wait_event(status,instance,timeout=25):
    deadline=time.monotonic()+timeout
    while True:
        _,events=request('http://127.0.0.1:18081/events')
        matches=[e for e in events if e.get('status')==status and any(a.get('labels',{}).get('instance')==instance for a in e['alerts'])]
        if matches:
            note('local webhook matched event='+json.dumps(matches[-1],ensure_ascii=False))
            return matches[-1]
        if time.monotonic()>=deadline: raise AssertionError('Missing webhook event: '+status)
        time.sleep(1)

stopped=False
try:
    note('actor=Codex; scope=cloud-container procedure verification; not personal independent execution')
    sha=command(['git','-C','/workspace/server','rev-parse','HEAD']).strip()
    command(docker+['version','--format','client={{.Client.Version}} server={{.Server.Version}}'])
    command(compose+['version','--short'])
    command(compose+['config','--quiet'])
    command(compose+['ps','--format','table {{.Service}}\t{{.State}}\t{{.Health}}'])
    result=command(['curl','--noproxy','127.0.0.1','--fail','--silent','--show-error','--max-time','10','-w','\nhttp=%{http_code}\n','http://127.0.0.1:18080/healthz'])
    assert '"status":"ok"' in result.replace(' ','') and 'http=200' in result
    passed('healthz before failure','HTTP 200; JSON status=ok')
    result=command(['curl','--noproxy','127.0.0.1','--silent','--show-error','--max-time','10','-o','/dev/null','-w','http=%{http_code}\n','http://127.0.0.1:18080/'])
    assert 'http=401' in result
    passed('anonymous access','HTTP 401')
    password=(root/'dashboard_password.txt').read_text().strip()
    auth=base64.b64encode(('monitor:'+password).encode()).decode()
    status,_=request('http://127.0.0.1:18080/api/stats',headers={'Authorization':'Basic '+auth})
    assert status==200
    passed('authenticated access','HTTP 200; credential and response body not recorded')
    wait_metric('up{job="server-monitor"}','1')
    wait_metric('probe_success{job="blackbox-probe-health"}','1')
    passed('monitoring before failure','app scrape up=1; entrance probe_success=1')
    command(compose+['stop','nginx']);stopped=True
    state=command(docker+['inspect','--format','{{.State.Status}} {{.State.Health.Status}}','ns7jp-demo-check-20261031-app-1']).strip()
    assert state=='running healthy'
    passed('app while entrance is stopped',state)
    result=command(['curl','--noproxy','127.0.0.1','--silent','--show-error','--max-time','10','-o','/dev/null','-w','http=%{http_code}\n','http://127.0.0.1:18080/healthz'],expected=7)
    assert 'http=000' in result
    passed('entrance connection failure','curl exit 7; http_code=000 (no HTTP response)')
    wait_metric('probe_success{job="blackbox-probe-health"}','0')
    wait_metric('up{job="server-monitor"}','1')
    passed('monitoring while entrance is stopped','app scrape up=1; entrance probe_success=0')
    command(compose+['start','nginx']);stopped=False
    deadline=time.monotonic()+20
    while True:
        try:
            status,body=request('http://127.0.0.1:18080/healthz')
            if status==200 and body.get('status')=='ok':break
        except Exception:pass
        if time.monotonic()>=deadline:raise AssertionError('HTTP did not recover')
        time.sleep(1)
    passed('manual recovery','HTTP 200; JSON status=ok')
    wait_metric('probe_success{job="blackbox-probe-health"}','1')
    passed('monitoring after recovery','entrance probe_success=1')
    now=datetime.now(timezone.utc)
    instance='demo-procedure-'+now.strftime('%Y%m%dT%H%M%SZ')
    payload=[{'labels':{'alertname':'PortfolioDemo','severity':'warning','instance':instance},'annotations':{'summary':'Synthetic procedure validation alert'},'startsAt':now.isoformat(),'endsAt':(now+timedelta(minutes=5)).isoformat()}]
    note('POST local Alertmanager /api/v2/alerts: synthetic PortfolioDemo; independent of nginx failure')
    req=Request('http://127.0.0.1:19093/api/v2/alerts',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
    with opener.open(req,timeout=5) as response: assert response.status==200
    firing=wait_event('firing',instance)
    payload[0]['endsAt']=(datetime.now(timezone.utc)-timedelta(seconds=1)).isoformat()
    req=Request('http://127.0.0.1:19093/api/v2/alerts',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
    with opener.open(req,timeout=5) as response: assert response.status==200
    resolved=wait_event('resolved',instance)
    (root/'local-webhook-events.json').write_text(json.dumps([firing,resolved],ensure_ascii=False,indent=2)+'\n')
    passed('local notification','synthetic PortfolioDemo FIRING and RESOLVED received; Slack not tested')
    command(compose+['ps','--format','table {{.Service}}\t{{.State}}\t{{.Health}}'])
    note('All scoped checks passed.')
finally:
    if stopped:
        note('Cleanup recovery: restarting test nginx after verification exception.')
        command(compose+['start','nginx'])
    (root/'checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
    log.close()
