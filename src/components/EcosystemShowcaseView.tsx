import React from "react";
import {
  Globe,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Mail,
  Send,
  Building2,
  CheckCircle2,
  Server,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

export function EcosystemShowcaseView() {
  const platforms = [
    {
      name: "algo2world.com",
      alt: "a2w.in",
      tag: "Core Engineering Lab",
      category: "Enterprise Infrastructure & Distributed Systems",
      desc: "Architecting sovereign computing infrastructure, high-concurrency systems, and custom hypervisor orchestration fabrics.",
      url: "https://algo2world.com",
      color: "from-indigo-500/20 to-indigo-900/10 border-indigo-500/30 text-indigo-400",
    },
    {
      name: "samvad.chat",
      alt: "ind.social",
      tag: "Sovereign Discourse",
      category: "Privacy-First Matrix & Social Federation",
      desc: "End-to-end encrypted messaging, federated social protocols, and decentralized communication relays for sovereign communities.",
      url: "https://samvad.chat",
      color: "from-emerald-500/20 to-emerald-900/10 border-emerald-500/30 text-emerald-400",
    },
    {
      name: "ind.network",
      alt: "ind.center",
      tag: "Mesh & Identity",
      category: "Decentralized Routing & Developer API Gateways",
      desc: "Next-generation distributed networking, encrypted overlay mesh routing, and sovereign identity registry.",
      url: "https://ind.network",
      color: "from-cyan-500/20 to-cyan-900/10 border-cyan-500/30 text-cyan-400",
    },
    {
      name: "ind.trading",
      alt: "ind.report",
      tag: "Quantitative Intelligence",
      category: "High-Frequency Trading & Market Telemetry",
      desc: "Ultra-low latency algorithmic execution, predictive volatility models, and decentralized investigative financial research.",
      url: "https://ind.trading",
      color: "from-amber-500/20 to-amber-900/10 border-amber-500/30 text-amber-400",
    },
    {
      name: "ind.shiksha",
      alt: "ind.quest",
      tag: "Open Knowledge Universe",
      category: "Adaptive Learning Graph & Skill Discovery",
      desc: "Universal multi-domain knowledge graph, syllabus-aligned pedagogical engines, and interactive technical challenges.",
      url: "https://ind.shiksha",
      color: "from-purple-500/20 to-purple-900/10 border-purple-500/30 text-purple-400",
    },
    {
      name: "ind.run",
      alt: "ind.pet",
      tag: "Cloud Fabric & Care",
      category: "Serverless Execution & Community Welfare",
      desc: "Sovereign container execution runtime, serverless microservices fabric, and centralized animal welfare registry.",
      url: "https://ind.run",
      color: "from-rose-500/20 to-rose-900/10 border-rose-500/30 text-rose-400",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Hero / Founder Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-slate-900 border-2 border-indigo-500/40 p-2 shadow-2xl shrink-0">
              <img
                src="https://avatars.githubusercontent.com/u/34476702?v=4"
                alt="Algo2World"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
                <Building2 className="w-3.5 h-3.5" />
                <span>🏢 Developed & Maintained by Algo2World</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                Nikil <span className="text-slate-400 text-lg font-normal">| Founder & Lead Architect</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                Enterprise Full-Stack Architecture • Bare-Metal Linux Infrastructure • High-Concurrency Distributed Systems • Sovereign Computing Fabrics.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                <a
                  href="https://algo2world.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>algo2world.com</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
                <a
                  href="mailto:nikil@algo2world.com"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>nikil@algo2world.com</span>
                </a>
                <a
                  href="https://t.me/AUTO_GPT_BOT"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Telegram: @AUTO_GPT_BOT</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ind. Sovereign Ecosystem Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <span>🌐 Ind. Sovereign Ecosystem Suite</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore interconnected, sovereign, and privacy-first web platforms built and operated by Algo2World.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((p, idx) => (
            <a
              key={idx}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="group relative rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-indigo-300 transition-colors">
                    {p.tag}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>

                <div className="flex items-baseline space-x-2">
                  <h4 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {p.name}
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">({p.alt})</span>
                </div>

                <p className="text-xs font-medium text-slate-400 mt-1">{p.category}</p>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{p.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-indigo-300">
                <span>Visit Platform</span>
                <span className="font-mono">→</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Commercial Consulting & 24/7 SLA AMC Contracts */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-indigo-500/30 p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span>💼 Commercial Consulting & 24/7 SLA AMC Contracts</span>
            </div>
            <h3 className="text-xl font-bold text-slate-100">
              Need Enterprise Hypervisor Architecture or 24/7 Operations?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We provide turnkey consulting, custom automated disaster recovery pipelines, multi-terabyte Ceph storage engineering, and dedicated 24/7 SLA support agreements for production Proxmox VE environments.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Node HA Proxmox Clusters</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero-RTO Ceph / PBS Pipelines</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>24/7 Production SLA & Auditing</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <a
              href="mailto:nikil@algo2world.com?subject=Proxmox%20Enterprise%20Consulting%20Inquiry"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Book Architecture Consultation</span>
            </a>
            <a
              href="https://t.me/AUTO_GPT_BOT"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all border border-slate-700 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4 text-indigo-400" />
              <span>Telegram Dispatch</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
