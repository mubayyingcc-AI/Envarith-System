import { useState } from "react";
import { evaluateAuthority } from "./services/authorization";
import type { AuthorizationDecision, AuthorityEnvelope, ProposedAction } from "./types/authority";
import {
  ArrowDownRight, ArrowRight, BadgeCheck, Blocks, BookOpen, Check,
  ChevronDown, CircleDot, FileCheck2, Fingerprint, GitBranch, Menu,
  Network, ShieldCheck, Sparkles, X,
} from "lucide-react";

const modules = [
  { icon: Fingerprint, title: "Authority", label: "Define the mandate", description: "Scope agent actions, resource access, limits, expiry, and accountable ownership." },
  { icon: CircleDot, title: "Oversight Center", label: "Intervene at the right moment", description: "Route exceptions, high-impact actions, and policy conflicts to authorized people." },
  { icon: Network, title: "Accountability Graph", label: "Connect the chain of responsibility", description: "Link agents, versions, policies, tools, approvals, actions, and outcomes." },
  { icon: FileCheck2, title: "Evidence Vault", label: "Make decisions reviewable", description: "Bring decision context, approvals, changes, and outcomes into a structured record." },
  { icon: Blocks, title: "Contract Intelligence", label: "Translate obligations into controls", description: "Turn contract language into reviewable candidate obligations and mapped safeguards." },
  { icon: ShieldCheck, title: "Incident Command", label: "Respond and reauthorize", description: "Coordinate containment, investigation, remediation, and authority reassessment." },
];

const principles = [
  ["01", "Authority before action", "An agent's capability is not the same as permission. Every consequential action should be evaluated against a scoped mandate."],
  ["02", "Human judgment where it matters", "Escalate decisions according to risk, impact, uncertainty, and policy—not by asking a person to approve every trivial step."],
  ["03", "Evidence with accountable ownership", "Connect the decision, applicable policy, approver, owner, and outcome so teams can investigate what happened."],
];

type Decision = AuthorizationDecision["outcome"];

function evaluateAction(action: string, amount: number, evidence: boolean): { decision: Decision; reason: string } {
  const actionType = action === "Issue refund"
    ? "issue_refund"
    : action === "Send customer email"
      ? "send_template_email"
      : "delete_account";

  const envelope: AuthorityEnvelope = {
    id: "gae-demo-refunds",
    tenantId: "demo-tenant",
    subjectId: "demo-agent",
    accountableOwnerId: "demo-operations-owner",
    allowedActions: ["issue_refund", "send_template_email"],
    prohibitedActions: ["delete_account"],
    maxAmount: 500,
    requiredEvidence: ["order_record"],
    requireHumanApprovalFor: ["send_template_email"],
    issuedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2030-01-01T00:00:00.000Z",
    status: "ACTIVE",
    policyVersion: "demo-policy-v1",
  };

  const request: ProposedAction = {
    requestId: `demo-${actionType}-${amount}`,
    tenantId: "demo-tenant",
    subjectId: "demo-agent",
    actionType,
    amount: actionType === "issue_refund" ? amount : undefined,
    evidencePresent: evidence ? ["order_record"] : [],
  };

  const result = evaluateAuthority(request, envelope);
  return { decision: result.outcome, reason: result.explanation };
}

function AuthorityDemo() {
  const [action, setAction] = useState("Issue refund");
  const [amount, setAmount] = useState(250);
  const [evidence, setEvidence] = useState(true);
  const [result, setResult] = useState<{ decision: Decision; reason: string } | null>(null);

  return (
    <div className="demo-panel">
      <div className="demo-top"><span className="live-dot" /> AUTHORITY PLAYGROUND <span className="demo-label">SIMULATION</span></div>
      <div className="demo-body">
        <div className="demo-title-row"><div><p className="eyebrow">POLICY DECISION PREVIEW</p><h3>Can this agent act?</h3></div><Sparkles size={21} /></div>
        <label className="field-label" htmlFor="action">Proposed action</label>
        <select id="action" value={action} onChange={(e) => { setAction(e.target.value); setResult(null); }}>
          <option>Issue refund</option><option>Send customer email</option><option>Delete customer account</option>
        </select>
        {action === "Issue refund" && <div className="amount-row"><label className="field-label" htmlFor="amount">Refund amount</label><strong>${amount}</strong></div>}
        {action === "Issue refund" && <input id="amount" type="range" min="0" max="1000" step="50" value={amount} onChange={(e) => { setAmount(Number(e.target.value)); setResult(null); }} />}
        <label className="evidence-check"><input type="checkbox" checked={evidence} onChange={(e) => { setEvidence(e.target.checked); setResult(null); }} /><span><strong>Required evidence attached</strong><small>Order record and policy context available</small></span></label>
        <button className="button button-primary demo-button" onClick={() => setResult(evaluateAction(action, amount, evidence))}>Evaluate example action <ArrowRight size={16} /></button>
        {result && <div className={`decision-result decision-${result.decision.toLowerCase()}`} role="status"><span className="decision-chip">{result.decision.replaceAll("_", " ")}</span><p>{result.reason}</p></div>}
        <p className="demo-disclaimer">Illustrative client-side simulation only. It does not call an external system or enforce real permissions.</p>
      </div>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("");
  const navItems = ["Platform", "Solutions", "Academy", "Talent", "Research", "Developers", "Company"];

  return (
    <>
      <header className="site-header">
        <div className="container nav-wrap">
          <a className="brand" href="#home" aria-label="Envarith home"><span className="brand-mark"><GitBranch size={22} strokeWidth={2.2} /></span><span>envarith<span className="brand-period">.</span><small>AI AUTHORITY INFRASTRUCTURE</small></span></a>
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close navigation" : "Open navigation"}>{menuOpen ? <X /> : <Menu />}</button>
          <nav className={menuOpen ? "main-nav nav-open" : "main-nav"} aria-label="Main navigation">
            {navItems.map((item) => <a key={item} href={item === "Platform" ? "#platform" : item === "Solutions" ? "#solutions" : `#${item.toLowerCase()}`} className={activeNav === item ? "nav-active" : ""} onClick={() => { setActiveNav(item); setMenuOpen(false); }}>{item}<ChevronDown size={13} /></a>)}
            <a className="nav-contact" href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          </nav>
          <a className="button button-small button-primary header-cta" href="#playground">Explore the platform <ArrowRight size={15} /></a>
        </div>
      </header>

      <main id="home">
        <section className="hero section">
          <div className="hero-grid container">
            <div className="hero-copy">
              <div className="pill"><span className="pill-dot" /> A NEW CONTROL LAYER FOR AI AGENTS</div>
              <h1>Govern the action.<br /><span>Prove the authority.</span></h1>
              <p className="hero-lede">Give AI agents a clear mandate. Route consequential decisions to the right people. Connect every important action to accountable ownership and reviewable evidence.</p>
              <div className="hero-actions"><a className="button button-primary" href="#playground">Explore the authority model <ArrowRight size={17} /></a><a className="button button-quiet" href="#platform">Discover the platform <ArrowDownRight size={17} /></a></div>
              <div className="hero-proof"><div className="avatar-stack"><span>G</span><span>A</span><span>H</span></div><p><strong>Designed for accountable autonomy</strong><small>Security · Governance · Risk · Operations</small></p></div>
            </div>
            <div className="hero-visual">
              <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
              <div className="visual-core"><div className="core-icon"><ShieldCheck size={31} /></div><span>AUTHORITY<br />GATEWAY</span><small>POLICY · SCOPE · EVIDENCE</small></div>
              <div className="orbit-node node-agent"><span className="node-icon"><Sparkles size={16} /></span><div><strong>AI Agent</strong><small>Proposed action</small></div></div>
              <div className="orbit-node node-policy"><span className="node-icon"><BadgeCheck size={16} /></span><div><strong>Policy engine</strong><small>Scope verified</small></div></div>
              <div className="orbit-node node-human"><span className="node-icon"><BookOpen size={16} /></span><div><strong>Human authority</strong><small>Escalate if needed</small></div></div>
              <div className="orbit-node node-evidence"><span className="node-icon"><FileCheck2 size={16} /></span><div><strong>Evidence record</strong><small>Decision trace</small></div></div>
              <div className="visual-caption"><span className="live-dot" /> AUTHORITY FLOW <span>01 / 04</span></div>
            </div>
          </div>
          <div className="hero-bottom container"><span>THE AUTHORITY LAYER BETWEEN AI INTENT AND REAL-WORLD ACTION</span><div><span>01</span> DEFINE <i /> <span>02</span> EVALUATE <i /> <span>03</span> AUTHORIZE <i /> <span>04</span> EVIDENCE</div></div>
        </section>

        <section className="trust-strip"><div className="container trust-inner"><span>BUILT AROUND FIVE PRACTICAL NEEDS</span><strong><Check size={15} /> Scoped authority</strong><strong><Check size={15} /> Human escalation</strong><strong><Check size={15} /> Action evidence</strong><strong><Check size={15} /> Revocation readiness</strong></div></section>

        <section className="section section-light" id="platform">
          <div className="container"><div className="section-heading"><div><p className="eyebrow">THE ENVARITH PLATFORM</p><h2>From policy language<br />to <span>governed action.</span></h2></div><p className="section-intro">A connected control plane for defining authority, evaluating proposed actions, escalating exceptions, and preserving the context needed to review outcomes.</p></div>
            <div className="module-grid">{modules.map(({ icon: Icon, title, label, description }, i) => <article className="module-card" key={title}><div className="module-top"><span className="module-icon"><Icon size={21} /></span><span className="module-number">0{i + 1}</span></div><p className="module-label">{label}</p><h3>{title}</h3><p>{description}</p><a href="#playground" aria-label={`Explore ${title}`}>Explore module <ArrowRight size={15} /></a></article>)}</div>
          </div>
        </section>

        <section className="section dark-section" id="solutions"><div className="container split-section"><div><p className="eyebrow">A PRACTICAL OPERATING MODEL</p><h2>Autonomy needs<br />a <span>defined boundary.</span></h2><p className="section-intro">A model can be capable without being authorized. Envarith is designed to make that distinction operational—before the tool call, not only after an incident.</p><a className="button button-outline" href="#playground">Try the decision preview <ArrowRight size={16} /></a></div><div className="principles-list">{principles.map(([number, title, body]) => <article key={number} className="principle"><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div><ArrowDownRight size={18} /></article>)}</div></div></section>

        <section className="section section-light" id="playground"><div className="container demo-section"><div className="demo-copy"><p className="eyebrow">INTERACTIVE PREVIEW</p><h2>Make the decision<br /><span>visible.</span></h2><p>Explore how a proposed action might be checked against an example mandate. The preview demonstrates four possible outcomes and makes the reason visible.</p><ul className="outcome-list"><li><span className="outcome-dot permit" /> Permit — checks pass</li><li><span className="outcome-dot conditional" /> Permit with conditions</li><li><span className="outcome-dot escalate" /> Escalate to a human</li><li><span className="outcome-dot deny" /> Deny and record</li></ul><p className="small-note"><Check size={14} /> No external systems are called by this demo.</p></div><AuthorityDemo /></div></section>

        <section className="section academy-section" id="academy"><div className="container academy-inner"><div className="academy-symbol"><BookOpen size={30} /><span>FIELD NOTES / 001</span></div><div><p className="eyebrow">PRACTICE. EVIDENCE. ACCOUNTABILITY.</p><h2>Governance should be<br />something teams can <span>practice.</span></h2><p>Envarith's planned Academy and Talent Network will connect practical simulations, assessed skills, and practitioner discovery. These capabilities are on the roadmap, not yet available in this scaffold.</p></div><a className="button button-outline" href="#contact">Discuss early access <ArrowRight size={16} /></a></div></section>

        <section className="section section-light" id="research"><div className="container closing-grid"><div><p className="eyebrow">BUILT FOR REVIEW, NOT BLIND TRUST</p><h2>Every permission should<br />have a <span>reason.</span></h2></div><div><p>Authority must be scoped, time-limited, revocable, and tied to a responsible owner. Evidence should help people understand a decision without pretending that a log alone proves the underlying event or settles legal responsibility.</p><div className="closing-links"><a href="#platform">Explore the modules <ArrowRight size={15} /></a><a href="#contact">Talk with the team <ArrowRight size={15} /></a></div></div></div></section>

        <section className="contact-section" id="contact"><div className="container contact-inner"><div><p className="eyebrow">START WITH THE AUTHORITY PROBLEM</p><h2>Bring your agent use case<br />into the <span>conversation.</span></h2><p>Tell us which actions you need to govern, who owns the risk, and what evidence your organization needs.</p></div><a className="button button-primary" href="mailto:hello@envarith.ai?subject=Envarith%20early%20access">Contact Envarith <ArrowRight size={17} /></a></div></section>
      </main>

      <footer className="site-footer"><div className="container footer-top"><a className="brand footer-brand" href="#home"><span className="brand-mark"><GitBranch size={21} /></span><span>envarith<span className="brand-period">.</span><small>GOVERN THE ACTION. PROVE THE AUTHORITY.</small></span></a><p>AI Authority Infrastructure<br /><span>Designed for accountable autonomy.</span></p><a href="#home" className="back-top">Back to top ↑</a></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Envarith. Early-stage product.</span><span>Capabilities shown may be illustrative or planned. No compliance guarantee is implied.</span><a href="https://github.com/mubayyingcc-AI/Envarith-System">GitHub repository <ArrowRight size={13} /></a></div></footer>
    </>
  );
}

export default App;
