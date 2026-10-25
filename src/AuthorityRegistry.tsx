import { useState } from "react";
import "./styles/authority-registry.css";

export default function AuthorityRegistry() {
 const [token,setToken]=useState("");
 const [records,setRecords]=useState<any[]>([]);
 const [message,setMessage]=useState("Connect with an authorized tenant credential to load records.");
 const [subject,setSubject]=useState("support-agent");
 const [owner,setOwner]=useState("operations-owner");
 const [allowed,setAllowed]=useState("issue_refund");
 const [resources,setResources]=useState("orders");
 const [expires,setExpires]=useState(new Date(Date.now()+30*86400000).toISOString().slice(0,16));
 const [busy,setBusy]=useState(false);
 async function call(path:string,method="GET",body?:unknown) {
  const headers:Record<string,string>={"Content-Type":"application/json"};
  headers["Authorization"]="Bearer "+token.trim();
  const response=await fetch(path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||"Request failed");
  return data;
 }
 async function load(){setBusy(true);try{const d=await call("/api/authority/envelopes");setRecords(d.items||[]);setMessage("Loaded "+(d.items||[]).length+" stored mandate(s).");}catch(e){setMessage(e instanceof Error?e.message:"Unable to load records.");}finally{setBusy(false);}}
 async function create(e:React.FormEvent){e.preventDefault();setBusy(true);try{await call("/api/authority/envelopes","POST",{subjectId:subject,accountableOwnerId:owner,allowedActions:allowed.split(",").map(x=>x.trim()).filter(Boolean),prohibitedActions:["delete_account"],allowedResources:resources.split(",").map(x=>x.trim()).filter(Boolean),requiredEvidence:["order_record"],requireHumanApprovalFor:[],maxAmount:250,policyVersion:"support-policy-v1",expiresAt:new Date(expires).toISOString()});setMessage("Mandate saved. Refreshing from the backend.");await load();}catch(e){setMessage(e instanceof Error?e.message:"Unable to create mandate.");}finally{setBusy(false);}}
 return <main className="registry-page"><div className="registry-container">
 <a href="/platform">← Platform overview</a><p className="eyebrow">ENVARITH / AUTHORITY</p><h1>Authority Registry</h1><p className="registry-intro">Create and review tenant-scoped Governed Action Envelopes.</p>
 <div className="registry-warning"><strong>Prototype boundary:</strong> this API stores authority and policy decisions. It does not intercept or execute external agent actions. Approval workflows and production identity management remain unfinished. The credential entered below is used for this browser session only and is not saved by this page.</div>
 <section className="registry-key"><label htmlFor="registry-token">Authorized tenant credential</label><div className="registry-row"><input id="registry-token" type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} placeholder="Enter credential supplied by your administrator"/><button type="button" disabled={busy||!token.trim()} onClick={load}>Load records</button></div></section>
 <p className="registry-message" role="status">{message}</p>
 <div className="registry-columns"><form className="registry-form" onSubmit={create}><h2>New mandate</h2>
 <label>Agent identifier<input required value={subject} onChange={e=>setSubject(e.target.value)}/></label>
 <label>Accountable owner<input required value={owner} onChange={e=>setOwner(e.target.value)}/></label>
 <label>Allowed actions (comma-separated)<input required value={allowed} onChange={e=>setAllowed(e.target.value)}/></label>
 <label>Allowed resources (comma-separated)<input value={resources} onChange={e=>setResources(e.target.value)}/></label>
 <label>Expiry<input type="datetime-local" required value={expires} onChange={e=>setExpires(e.target.value)}/></label>
 <button type="submit" disabled={busy||!token.trim()}>{busy?"Working…":"Create mandate"}</button></form>
 <section className="registry-records"><div className="registry-records-title"><h2>Stored mandates</h2><button type="button" disabled={busy||!token.trim()} onClick={load}>Refresh</button></div>
 {records.length===0?<p>No records loaded. Authenticate and load from the backend.</p>:records.map((r:any)=><article className="registry-record" key={r.id}><span>{r.status}</span><h3>{r.subject_id}</h3><p>Owner: {r.accountable_owner_id}</p><p>Allowed: {Array.isArray(r.allowed_actions)?r.allowed_actions.join(", "):String(r.allowed_actions)}</p><p>Policy: {r.policy_version}</p><p>Expires: {r.expires_at?new Date(r.expires_at).toLocaleString():"Unknown"}</p><small>{r.id}</small></article>)}</section></div>
 </div></main>;
}
