import { ArrowRight, BookOpen, ChevronDown, GitBranch, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

type Page = { path: string; title: string; eyebrow: string; summary: string; sections: { title: string; body: string; bullets?: string[] }[]; status?: "Available as concept" | "In development" | "Planned"; };

const pages: Page[] = [
  { path: "/platform", title: "The Envarith platform", eyebrow: "PLATFORM OVERVIEW", summary: "A connected authority-to-evidence control plane for defining what agents may do, evaluating proposed actions, routing exceptions, and preserving decision context.", sections: [
    { title: "Start with the mandate", body: "Define the agent, accountable owner, permitted and prohibited actions, resource scope, limits, expiry, evidence requirements, and escalation conditions.", bullets: ["Governed Action Envelopes", "Scoped permissions and action limits", "Expiry and revocation concepts"] },
    { title: "Evaluate before consequential action", body: "Evaluate a proposed action against the applicable mandate and return a reasoned policy outcome. The current API records decisions; it does not execute or block actions in external systems.", bullets: ["Permit", "Permit with conditions", "Escalate to an authorized human", "Deny and record"] },
    { title: "Preserve the chain of accountability", body: "Connect the mandate, policy version, agent, tool, accountable owner, decision, evidence, and later remediation so teams can review what was intended and what was recorded." }
  ] },
  { path: "/platform/authority", title: "Authority Registry", eyebrow: "01 / AUTHORITY", summary: "Define an agent's mandate as a structured, reviewable object—not a vague instruction or a broad API credential.", status: "In development", sections: [
    { title: "Mandates that express boundaries", body: "A Governed Action Envelope captures the subject, tenant, accountable owner, allowed and prohibited actions, amount limits, required evidence, approval conditions, policy version, issue time, expiry, and status." , bullets: ["Allowed and prohibited actions", "Owner and scope", "Expiry and revocation", "Policy version and evidence requirements"]},
    { title: "Lifecycle", body: "Draft, review, activate, amend, suspend, revoke, and expire mandates through a controlled lifecycle. A future production workflow must authenticate the actor and preserve each material change."},
    { title: "Current status", body: "The prototype API supports creating, listing, and revoking authority envelopes. The current website's playground is illustrative; neither is an external execution enforcement boundary."}
  ]},
  { path: "/platform/oversight", title: "Oversight Center", eyebrow: "02 / HUMAN OVERSIGHT", summary: "Route the right exceptions to the right accountable person, with enough context to make a decision.", status: "Planned", sections: [
    { title: "Risk-based escalation", body: "Escalate high-impact, out-of-scope, uncertain, or policy-conflicting actions rather than interrupting people for every routine step.", bullets: ["Risk and impact thresholds", "Reason-coded escalation", "Queue ownership and service targets"]},
    { title: "Human decisions need evidence", body: "A future workflow should bind an approval to an authenticated identity, exact proposed action, relevant evidence, expiry, and policy version. A boolean flag or free-text note is not proof of approval."},
    { title: "Intervention and override", body: "Capture approve, deny, modify, defer, and revoke decisions with reason, owner, timestamp, and resulting authority state."}
  ]},
  { path: "/platform/accountability-graph", title: "Accountability Graph", eyebrow: "03 / RESPONSIBILITY", summary: "Map the relationships between agents, models, policies, tools, people, contracts, actions, outcomes, and incidents.", status: "In development", sections: [
    { title: "Connect the full chain", body: "The graph is designed to connect an AI agent to its model/version, prompt or policy, data source, tool/API, vendor obligation, human approver, accountable owner, action, outcome, and remediation."},
    { title: "Change impact", body: "When a model, tool, policy, contract, owner, or risk assessment changes, identify affected mandates and controls for review instead of assuming old authorization still applies."},
    { title: "Current status", body: "The API includes create and list operations for typed accountability edges. Rich graph exploration, impact analysis, and relationship validation remain future work."}
  ]},
  { path: "/platform/evidence-vault", title: "Evidence Vault", eyebrow: "04 / EVIDENCE", summary: "Keep decision records reviewable, exportable, and tied to their source context without overstating what a log proves.", status: "In development", sections: [
    { title: "A useful evidence record", body: "Capture the decision, action request, mandate and policy versions, reason codes, identity context, approval references, execution receipt when available, and later corrections."},
    { title: "Integrity is not truth", body: "Hash chaining can help detect certain changes to stored records. It does not prove that the original event was true, that an external action occurred, or that a legal obligation was satisfied."},
    { title: "Verification and portability", body: "The prototype includes evidence-chain verification and is being developed toward tenant-scoped export, retention, deletion, and independently checkable evidence packages."}
  ]},
  { path: "/platform/contract-intelligence", title: "Contract Intelligence", eyebrow: "05 / CONTRACT-TO-CONTROL", summary: "Translate vendor AI terms into human-reviewed obligations and candidate operational controls.", status: "Planned", sections: [
    { title: "Review the clauses that matter", body: "Structure review around agent accountability, authorized actions, output ownership, customer data rights, audit rights, disclosure, model changes, indemnity, liability limits, and incident notification."},
    { title: "From clause to control", body: "Extract candidate obligations, preserve the source passage, assign a reviewer, map the obligation to a control and owner, and create a testable follow-up. AI extraction should not be presented as legal advice or a final legal conclusion."},
    { title: "Human review is required", body: "Contract interpretations must be reviewed by an appropriate legal or procurement professional before being treated as approved obligations."}
  ]},
  { path: "/platform/incident-command", title: "Incident Command", eyebrow: "06 / RESPONSE", summary: "Coordinate containment, investigation, accountability review, remediation, and reauthorization when an agent action goes wrong.", status: "Planned", sections: [
    { title: "A structured incident timeline", body: "Bring together the affected agent, mandate, policy version, action records, evidence, owners, decisions, and remediation events."},
    { title: "Contain and reassess", body: "Support revocation or suspension recommendations, identify impacted mandates, and require explicit reauthorization after material changes or incidents."},
    { title: "Keep response claims precise", body: "An incident record is an operational aid. It does not itself establish root cause, regulatory compliance, or legal liability."}
  ]},
  { path: "/solutions", title: "Solutions for accountable autonomy", eyebrow: "SOLUTIONS", summary: "Apply authority controls to the workflows where an agent can create real operational, financial, customer, or compliance consequences.", sections: [
    { title: "AI platform and security teams", body: "Create consistent authorization patterns across agents, tools, teams, and environments."},
    { title: "Risk, legal, and procurement", body: "Connect vendor obligations to operational controls and evidence requirements."},
    { title: "Operations owners", body: "Set clear action limits and escalation paths for support, finance, and business workflows."}
  ]},
  { path: "/solutions/customer-operations", title: "Customer operations agents", eyebrow: "SOLUTION / CUSTOMER OPERATIONS", summary: "Govern support agents that issue refunds, update customer records, or communicate externally.", sections: [
    { title: "Example governed workflow", body: "A support agent proposes a refund. Envarith checks the mandate, amount limit, required order evidence, and escalation rules. A policy outcome is recorded before an external execution adapter is considered."},
    { title: "High-value controls", body: "Refund ceilings, verified order evidence, account-change restrictions, message templates, customer-impact thresholds, and owner escalation."},
    { title: "Implementation boundary", body: "This is a target use case. The deployed prototype does not currently intercept a real support agent or execute the refund."}
  ]},
  { path: "/solutions/finance", title: "Finance and transaction workflows", eyebrow: "SOLUTION / FINANCE", summary: "Make financial authority explicit with amount limits, beneficiary scope, evidence requirements, and human review.", sections: [
    { title: "Constrain money-moving actions", body: "Set amount and currency limits, permitted transaction types, allowed destinations, required supporting evidence, and dual-control requirements."},
    { title: "Fail closed on missing context", body: "If a material field or required evidence is missing, escalate or deny rather than infer permission."},
    { title: "Never confuse evaluation with execution", body: "A policy decision only becomes a meaningful control when the execution path independently checks and enforces it."}
  ]},
  { path: "/solutions/procurement-legal", title: "Procurement and legal", eyebrow: "SOLUTION / PROCUREMENT & LEGAL", summary: "Turn vendor AI commitments into assigned, reviewable control work.", sections: [
    { title: "A structured vendor review", body: "Record contract source, clause, obligation candidate, risk, accountable reviewer, linked control, evidence request, and review date."},
    { title: "Track what remains unresolved", body: "Highlight missing audit rights, unclear output ownership, broad liability limitations, weak change notice, or uncertain use of customer data for review."},
    { title: "Professional judgement stays central", body: "The product supports review and traceability; it does not replace qualified legal advice."}
  ]},
  { path: "/solutions/regulated-enterprise", title: "Regulated enterprise", eyebrow: "SOLUTION / REGULATED ENTERPRISE", summary: "Build a traceable control story around agent authority, human oversight, and evidence.", sections: [
    { title: "Map controls to obligations", body: "Maintain mappings to applicable internal policies and selected frameworks such as NIST AI RMF. Applicability and legal interpretation require context-specific review."},
    { title: "Evidence that supports review", body: "Preserve versions, owners, exceptions, approvals, test outcomes, and remediation history."},
    { title: "No compliance guarantee", body: "Envarith is not a certification body and cannot guarantee compliance simply by generating records."}
  ]},
  { path: "/academy", title: "Envarith Academy", eyebrow: "ACADEMY", summary: "A planned practice-led learning environment for people responsible for AI agent governance.", status: "Planned", sections: [
    { title: "Learn by doing", body: "Work through mandate design, policy conflicts, vendor clause review, escalation decisions, evidence analysis, and incident response scenarios."},
    { title: "Assessment, not attendance alone", body: "Use practical exercises, scoring rubrics, feedback, and reassessment to demonstrate specific skills."},
    { title: "Skill records with honest limits", body: "Future skill passports and certificates should state what was assessed, when, and under which rubric. They will not guarantee competence in every workplace or employment."}
  ]},
  { path: "/academy/learning-paths", title: "Learning paths", eyebrow: "ACADEMY / LEARNING PATHS", summary: "Structured pathways for AI governance officers, technical implementers, auditors, procurement teams, and incident responders.", status: "Planned", sections: [
    { title: "Governance lead", body: "Mandates, risk tiering, ownership, escalation policy, control mapping, and governance reporting."},
    { title: "Technical implementer", body: "Authorization APIs, identity boundaries, policy testing, action adapters, evidence schemas, and failure handling."},
    { title: "Auditor and reviewer", body: "Evidence sufficiency, version comparison, exception handling, limitations, and reproducible review."}
  ]},
  { path: "/academy/simulations", title: "Practical simulations", eyebrow: "ACADEMY / SIMULATIONS", summary: "Practice consequential decisions in realistic but clearly labelled training environments.", status: "Planned", sections: [
    { title: "Scenario library", body: "Simulate refund escalation, unauthorized data access, ambiguous vendor clauses, model-change events, and agent incidents."},
    { title: "Scoring rubric", body: "Assess policy interpretation, evidence quality, risk recognition, escalation choice, and clarity of rationale."},
    { title: "Safe practice", body: "Training scenarios use synthetic data and must remain distinct from production customer records."}
  ]},
  { path: "/academy/assessments", title: "Assessments and skill passports", eyebrow: "ACADEMY / ASSESSMENT", summary: "A proposed way to record demonstrated governance skills and the conditions under which they were assessed.", status: "Planned", sections: [
    { title: "What a skill record should include", body: "Skill area, assessment version, rubric, score, date, assessor or automated scoring method, limitations, and evidence of completed exercises."},
    { title: "Renewal and improvement", body: "Skills can change. Support reassessment, expiry or refresh intervals where appropriate, and a record of improvement."},
    { title: "Avoid false assurance", body: "A badge is not proof of broad professional competence or a guarantee of employment."}
  ]},
  { path: "/talent", title: "Envarith Talent Network", eyebrow: "TALENT", summary: "A planned discovery layer connecting employers with practitioners who can demonstrate AI governance skills.", status: "Planned", sections: [
    { title: "Profiles based on evidence", body: "Represent skill areas, completed simulations, work samples, experience, and assessment context with clear consent controls."},
    { title: "Employer discovery", body: "Help teams find practitioners for governance, policy engineering, risk review, incident response, and AI security roles."},
    { title: "Privacy by design", body: "Candidate information should be disclosed only with permission, and assessment signals should not be presented as guarantees."}
  ]},
  { path: "/talent/for-employers", title: "Hire AI governance practitioners", eyebrow: "TALENT / EMPLOYERS", summary: "A planned employer workflow for describing roles and discovering relevant, evidence-backed skills.", status: "Planned", sections: [
    { title: "Role-aligned discovery", body: "Define required skills, sector context, seniority, and practical work expectations."},
    { title: "Review work, not labels alone", body: "Compare candidate portfolios and assessments alongside interviews, references, and the employer's own hiring process."}
  ]},
  { path: "/talent/for-practitioners", title: "Practitioner profiles", eyebrow: "TALENT / PRACTITIONERS", summary: "A proposed profile for showing practical AI governance experience and assessed skills.", status: "Planned", sections: [
    { title: "Show your evidence", body: "Present completed simulations, selected work samples, relevant experience, and specific skill assessments."},
    { title: "Control disclosure", body: "Choose what is visible, keep confidential work private, and revoke sharing where supported."}
  ]},
  { path: "/research", title: "Research and field notes", eyebrow: "RESEARCH", summary: "Explore the design questions behind accountable agent authority, evidence quality, and safe operational autonomy.", sections: [
    { title: "Authority-to-action gap", body: "Why a model's capability, a tool's technical access, and an agent's legitimate authority are three different things."},
    { title: "Evidence boundaries", body: "What hashes, logs, approvals, telemetry, and execution receipts can support—and what each cannot prove on its own."},
    { title: "Interoperability", body: "How Envarith can map to existing identity, policy, telemetry, and risk-management systems instead of replacing every tool."}
  ]},
  { path: "/research/architecture", title: "Architecture principles", eyebrow: "RESEARCH / ARCHITECTURE", summary: "The system principles guiding the Envarith prototype and its next engineering gates.", sections: [
    { title: "Separate decision from enforcement", body: "The policy service produces a decision; a protected execution adapter must independently enforce it before an external side effect."},
    { title: "Tenant isolation and data sovereignty", body: "Keep customer records scoped, support export and deletion, and do not pool private customer data for secondary use without explicit authorization."},
    { title: "Verifiable but bounded evidence", body: "Use canonical records and integrity checks while documenting trust assumptions, external checkpoints, and limitations."}
  ]},
  { path: "/research/standards", title: "Standards and control mapping", eyebrow: "RESEARCH / STANDARDS", summary: "Map relevant practices to existing frameworks without implying that a mapping is certification or legal advice.", sections: [
    { title: "NIST AI RMF", body: "Use Govern, Map, Measure, and Manage as a reference for organizing AI risk work where applicable."},
    { title: "Internal policy and regulation", body: "Track the source, jurisdiction, applicability rationale, control owner, evidence, and review date for each mapping."},
    { title: "Keep mappings current", body: "Frameworks and regulations change; assign owners and review mappings against authoritative sources."}
  ]},
  { path: "/developers", title: "Developer documentation", eyebrow: "DEVELOPERS", summary: "Integrate authority evaluation and evidence records into agent workflows, while respecting the current prototype's security boundaries.", sections: [
    { title: "Current API surface", body: "The prototype includes endpoints for health checks, authority envelope creation/listing/revocation, authorization evaluation, evidence retrieval and verification, and accountability edges."},
    { title: "Authentication", body: "Bootstrap API authentication uses server-configured bearer keys mapped to tenant, subject, and role. This is not a complete production identity lifecycle."},
    { title: "Before production", body: "Require short-lived credentials, rotation and revocation, tenant-isolation tests, independently authenticated approval objects, and a protected execution adapter."}
  ]},
  { path: "/developers/api", title: "Authority API", eyebrow: "DEVELOPERS / API", summary: "The prototype API records authorization decisions and evidence. It does not currently execute external agent actions.", sections: [
    { title: "Health", body: "GET /health checks process liveness. GET /api/health reports database connectivity."},
    { title: "Authority", body: "POST /api/authority/envelopes creates a mandate; GET /api/authority/envelopes lists scoped records; POST /api/authority/envelopes/:id/revoke revokes a mandate; POST /api/authority/evaluate records a policy evaluation."},
    { title: "Evidence and graph", body: "GET /api/authority/evidence reads evidence events; GET /api/authority/evidence/verify checks stored chain continuity; POST and GET /api/authority/accountability/edges create and list graph edges."},
    { title: "Integration warning", body: "Do not treat a returned PERMIT as proof that an external tool call is enforced. See API.md in the repository for full contracts and current limitations."}
  ]},
  { path: "/developers/integrations", title: "Integrations roadmap", eyebrow: "DEVELOPERS / INTEGRATIONS", summary: "A planned integration strategy for connecting Envarith to existing identity, agent, business, and security systems.", status: "Planned", sections: [
    { title: "Identity and policy", body: "Evaluate integration patterns for OIDC, service identities, policy engines such as OPA or Cedar, and least-privilege authorization."},
    { title: "Agent and business systems", body: "Prioritize one real governed workflow and one execution adapter before expanding across collaboration, CRM, ticketing, data, and cloud platforms."},
    { title: "Evidence and telemetry", body: "Use consistent event schemas and tracing to connect policy decisions to verified execution receipts where available."}
  ]},
  { path: "/developers/security", title: "Security and trust boundaries", eyebrow: "DEVELOPERS / SECURITY", summary: "A plain-language view of what the prototype protects today and what must be completed before production enforcement.", sections: [
    { title: "Implemented prototype controls", body: "The backend includes role checks, tenant identity derived from configured API credentials, request validation, idempotency handling, and evidence-chain verification endpoints."},
    { title: "Known gaps", body: "Static bootstrap keys, independent human-approval authentication, comprehensive tenant-isolation verification, external action enforcement, operational recovery tests, and external evidence checkpoints remain critical gates."},
    { title: "Responsible use", body: "Do not route real customer production actions through this prototype until the security and release gates are tested and documented."}
  ]},
  { path: "/company", title: "About Envarith", eyebrow: "COMPANY", summary: "Envarith is an early-stage AI Authority Infrastructure project focused on explicit agent mandates, accountable intervention, and reviewable evidence.", sections: [
    { title: "Our focus", body: "Help organizations distinguish what an AI agent can technically do from what it is authorized to do, who owns that authority, and how a consequential decision can be reviewed."},
    { title: "How we build", body: "We prefer narrow, testable workflows over broad claims. Every feature should have a contract, real implementation, repeatable tests, and an honest verification status."},
    { title: "Current stage", body: "The website and prototype are live, but several platform capabilities remain in development or planned. Deployment does not mean production readiness."}
  ]},
  { path: "/company/data-sovereignty", title: "Data sovereignty", eyebrow: "COMPANY / DATA SOVEREIGNTY", summary: "Customer data and Envarith's reusable product engine should remain clearly separated.", sections: [
    { title: "Customer-scoped records", body: "Policies, contracts, prompts, evidence, action records, and accountability graphs should be isolated by tenant and handled under clear contractual terms."},
    { title: "No silent secondary use", body: "Cross-customer pooling or reuse of private customer data requires explicit authorization and an appropriate legal basis."},
    { title: "Portability and deletion", body: "The target product includes customer export, retention, and deletion controls. These capabilities must be implemented and tested before being represented as available."}
  ]},
  { path: "/company/roadmap", title: "Product roadmap", eyebrow: "COMPANY / ROADMAP", summary: "A staged path from the current prototype to a verified governed-action workflow and then broader platform capabilities.", sections: [
    { title: "Stage 1 — Foundation", body: "Stabilize routing, design system, backend contracts, database migrations, CI, tenant isolation, and repeatable tests."},
    { title: "Stage 2 — One governed workflow", body: "Deliver a narrow support/refund scenario with mandate creation, policy evaluation, authenticated human approval, protected execution adapter, receipt, and evidence verification."},
    { title: "Stage 3 — Expand carefully", body: "Add contract-to-control workflows, oversight, graph exploration, incident response, developer integrations, then Academy and Talent features based on evidence and demand."}
  ]},
  { path: "/contact", title: "Contact Envarith", eyebrow: "CONTACT", summary: "Tell us about the agent actions, ownership boundaries, or evidence requirements your team needs to govern.", sections: [
    { title: "Start with a use case", body: "The most useful first conversation describes the agent, the consequential action, the systems it can reach, the accountable owner, and what must happen when authority is unclear."},
    { title: "Do not send secrets", body: "Please do not submit confidential contracts, customer records, credentials, or sensitive personal information through an initial enquiry."}
  ]},
];

const groups = [
  { label: "Platform", path: "/platform", items: [["Overview", "/platform"], ["Authority Registry", "/platform/authority"], ["Oversight Center", "/platform/oversight"], ["Accountability Graph", "/platform/accountability-graph"], ["Evidence Vault", "/platform/evidence-vault"], ["Contract Intelligence", "/platform/contract-intelligence"], ["Incident Command", "/platform/incident-command"]] },
  { label: "Solutions", path: "/solutions", items: [["Overview", "/solutions"], ["Customer Operations", "/solutions/customer-operations"], ["Finance", "/solutions/finance"], ["Procurement & Legal", "/solutions/procurement-legal"], ["Regulated Enterprise", "/solutions/regulated-enterprise"]] },
  { label: "Academy", path: "/academy", items: [["Overview", "/academy"], ["Learning Paths", "/academy/learning-paths"], ["Simulations", "/academy/simulations"], ["Assessments", "/academy/assessments"]] },
  { label: "Talent", path: "/talent", items: [["Overview", "/talent"], ["For Employers", "/talent/for-employers"], ["For Practitioners", "/talent/for-practitioners"]] },
  { label: "Research", path: "/research", items: [["Field Notes", "/research"], ["Architecture", "/research/architecture"], ["Standards Mapping", "/research/standards"]] },
  { label: "Developers", path: "/developers", items: [["Overview", "/developers"], ["Authority API", "/developers/api"], ["Integrations", "/developers/integrations"], ["Security", "/developers/security"]] },
  { label: "Company", path: "/company", items: [["About", "/company"], ["Data Sovereignty", "/company/data-sovereignty"], ["Roadmap", "/company/roadmap"], ["Contact", "/contact"]] },
];

function SiteHeader({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="container nav-wrap">
    <a className="brand" href="/" aria-label="Envarith home"><span className="brand-mark"><GitBranch size={22}/></span><span>envarith<span className="brand-period">.</span><small>AI AUTHORITY INFRASTRUCTURE</small></span></a>
    <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"}>{open ? <X/> : <Menu/>}</button>
    <nav className={open ? "main-nav nav-open" : "main-nav"} aria-label="Main navigation">
      {groups.map(group => <div className="nav-dropdown" key={group.label}>
        <a className={current.startsWith(group.path) ? "nav-active" : ""} href={group.path} onClick={() => setOpen(false)}>{group.label}<ChevronDown size={13}/></a>
        <div className="nav-dropdown-menu">{group.items.map(([label, path]) => <a key={path} href={path} onClick={() => setOpen(false)}>{label}</a>)}</div>
      </div>)}
      <a className="nav-contact" href="/contact" onClick={() => setOpen(false)}>Contact</a>
    </nav>
    <a className="button button-small button-primary header-cta" href="/platform">Explore platform <ArrowRight size={15}/></a>
  </div></header>;
}

export function SitePage({ path }: { path: string }) {
  const page = pages.find(p => p.path === path);
  if (!page) return <><SiteHeader current={path}/><main className="site-page"><div className="container page-hero"><p className="eyebrow">404 / PAGE NOT FOUND</p><h1>This route is not <span>available.</span></h1><p className="page-lede">The page may have moved or may not be part of the current Envarith site.</p><a className="button button-primary" href="/">Return to homepage <ArrowRight size={16}/></a></div></main></>;
  return <>
    <SiteHeader current={path}/>
    <main className="site-page">
      <section className="page-hero"><div className="container">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title.split(" ").slice(0, -1).join(" ")} <span>{page.title.split(" ").slice(-1).join("")}</span></h1>
        <p className="page-lede">{page.summary}</p>
        <div className="page-hero-actions"><a className="button button-primary" href="/contact">Discuss a use case <ArrowRight size={16}/></a><a className="button button-quiet" href="/platform">Explore the platform</a></div>
        {page.status && <p className="page-status"><span className="live-dot"/>{page.status} · Capability status is stated explicitly; no availability is implied.</p>}
      </div></section>
      <section className="page-content"><div className="container page-content-grid">
        <aside className="page-sidebar"><p className="eyebrow">EXPLORE ENVARITH</p>{groups.map(group => <div key={group.label}><a className="sidebar-parent" href={group.path}>{group.label}<ArrowRight size={13}/></a>{group.items.slice(1).map(([label, href]) => <a className={href === path ? "sidebar-link sidebar-active" : "sidebar-link"} href={href} key={href}>{label}</a>)}</div>)}</aside>
        <div className="page-main"><div className="page-section-intro"><ShieldCheck size={22}/><p>Authority is not just a policy statement. It needs a defined owner, a decision path, and evidence that can be reviewed.</p></div>
          {page.sections.map((section, i) => <article className="page-content-card" key={section.title}><div className="page-card-number">0{i + 1}</div><div><h2>{section.title}</h2><p>{section.body}</p>{section.bullets && <ul>{section.bullets.map(b => <li key={b}>{b}</li>)}</ul>}</div></article>)}
          <div className="page-next"><div><p className="eyebrow">NEXT STEP</p><h2>Start with one governed workflow.</h2><p>Identify one consequential action, its owner, the evidence required, and the condition that should stop it.</p></div><a className="button button-primary" href="/contact">Discuss your use case <ArrowRight size={16}/></a></div>
        </div>
      </div></section>
      <section className="page-related"><div className="container"><p className="eyebrow">RELATED DESTINATIONS</p><div className="related-grid">{groups.map(group => <a href={group.path} key={group.label}><span>{group.label}</span><ArrowRight size={15}/><small>{group.items.length} pages</small></a>)}</div></div></section>
    </main>
    <footer className="site-footer"><div className="container footer-top"><a className="brand footer-brand" href="/"><span className="brand-mark"><GitBranch size={21}/></span><span>envarith<span className="brand-period">.</span><small>GOVERN THE ACTION. PROVE THE AUTHORITY.</small></span></a><p>AI Authority Infrastructure<br/><span>Designed for accountable autonomy.</span></p><a href="#top" className="back-top">Back to top ↑</a></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Envarith. Early-stage product.</span><span>Some capabilities are in development or planned. No compliance guarantee is implied.</span><a href="https://github.com/mubayyingcc-AI/Envarith-System">GitHub repository <ArrowRight size={13}/></a></div></footer>
  </>;
}

export const knownSitePaths = pages.map(page => page.path);
