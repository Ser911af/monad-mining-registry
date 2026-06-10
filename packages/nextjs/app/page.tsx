"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useCertificateHistory } from "~~/hooks/useCertificateHistory";

const STANDARDS = ["NI 43-101 (Canadá)", "ECRR 2018 (Colombia)"];
const CATEGORIES = ["INFERRED", "INDICATED", "MEASURED"];
const RESERVE_CATEGORIES = ["NONE", "PROBABLE", "PROVED"];
const CATEGORY_BADGE = [
  "badge-ghost border-slate-700 text-slate-300",
  "badge-warning border-warning/30",
  "badge-success border-success/30",
];

const Home: NextPage = () => {
  const [lookupId, setLookupId] = useState("1");

  const { data: nextTokenId } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "nextTokenId",
  });

  const { data: cert } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "getCertificate",
    args: [lookupId ? BigInt(lookupId) : undefined],
  });

  const { data: historyData, fetching: fetchingHistory } = useCertificateHistory(lookupId);

  const certCategory = cert ? Number(cert.category) : 0;
  const reserveCategory = cert ? Number(cert.reserveCategory) : 0;

  return (
    <div className="relative flex flex-col grow items-center px-4 pt-12 pb-24 bg-slate-950 text-slate-100 min-h-[85vh] overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Hero Section */}
      <div className="relative max-w-3xl text-center space-y-6 mb-12">
        <div className="flex justify-center gap-2">
          <span className="badge badge-emerald badge-outline tracking-wider text-[10px] uppercase px-3 py-1 font-bold border-emerald-500/30">
            Monad Testnet
          </span>
          <span className="badge badge-primary badge-outline tracking-wider text-[10px] uppercase px-3 py-1 font-bold border-blue-500/30">
            Enfoque Pionero
          </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500">
            Monad Mining
          </span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
            Registry
          </span>
        </h1>
        
        <p className="text-sm md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Libro mayor inmutable de activos mineros bajo estándares técnicos globales, 
          desarrollado con una arquitectura pionera <span className="text-white">mobile-first</span>.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="relative w-full max-w-xl space-y-8">
        {/* Certificate Verification Card */}
        <div className="card bg-slate-900/30 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_-12px_rgba(16,185,129,0.1)] rounded-3xl overflow-hidden transition-all duration-500 hover:border-white/20">
          <div className="p-6 md:p-10 space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <span className="text-xl">🔎</span>
                </div>
                Portal de Verificación
              </h2>
              <p className="text-xs text-slate-400 ml-12">
                Consulta instantánea de certificados mediante Token ID.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">ID del Token</label>
              <div className="relative group">
                <input
                  className="input input-bordered w-full h-14 bg-slate-950/40 border-slate-800 rounded-2xl text-lg font-bold focus:outline-none focus:border-emerald-500/50 transition-all pl-6"
                  type="number"
                  min="1"
                  placeholder="Ej: 1"
                  value={lookupId}
                  onChange={e => setLookupId(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-xs">
                  #{lookupId || "0"}
                </div>
              </div>
            </div>

            {cert ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Título ID</span>
                    <span className="text-sm font-bold text-white">{cert.titleId}</span>
                  </div>
                  <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Estándar</span>
                    <span className="text-xs text-emerald-400 font-bold">
                      {STANDARDS[Number(cert.standard)]?.split(" ")[0]}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/40 rounded-2xl p-5 border border-slate-800/50 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-900/50">
                    <span className="text-xs text-slate-400 font-semibold">Categoría de Recurso</span>
                    <span className={`badge ${CATEGORY_BADGE[certCategory]} badge-sm font-bold h-6 px-3`}>
                      {CATEGORIES[certCategory]}
                    </span>
                  </div>

                  {reserveCategory > 0 && (
                    <div className="flex justify-between items-center pb-4 border-b border-slate-900/50">
                      <span className="text-xs text-slate-400 font-semibold">Reserva Declarada</span>
                      <span className="badge badge-accent badge-outline text-[10px] font-bold h-6 px-3">
                        {RESERVE_CATEGORIES[reserveCategory]}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-slate-400 font-semibold">Tonelaje Estimado</span>
                    <span className="text-sm font-mono text-slate-200">{cert.tonnage?.toString()} Tons</span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-slate-400 font-semibold">Punto de Corte</span>
                    <span className="text-sm font-mono text-slate-200">{cert.cutOffGradeBps?.toString()} Bps</span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-900/50">
                    <span className="text-xs text-slate-400 font-semibold">Persona Calificada</span>
                    <Address address={cert.qp} size="sm" />
                  </div>
                </div>

                {/* Audit Trail Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      Trazabilidad Histórica
                    </h3>
                    {fetchingHistory && <span className="loading loading-spinner loading-xs text-slate-500"></span>}
                  </div>

                  <div className="space-y-4 bg-slate-950/20 rounded-2xl p-4 border border-white/5">
                    {/* Category Changes */}
                    {historyData?.CategoryChange &&
                      historyData.CategoryChange.map((log: any) => (
                        <div key={log.id} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-200">
                              Avance a {CATEGORIES[Number(log.to)]}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {new Date(Number(log.timestamp) * 1000).toLocaleDateString()} • {new Date(Number(log.timestamp) * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                      ))}

                    {/* Reserve Declarations */}
                    {historyData?.ReserveDeclaration &&
                      historyData.ReserveDeclaration.map((log: any) => (
                        <div key={log.id} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-200">
                              Reserva {RESERVE_CATEGORIES[Number(log.reserveCategory)]}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {new Date(Number(log.timestamp) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}

                    {(!historyData?.CategoryChange || historyData.CategoryChange.length === 0) &&
                      (!historyData?.ReserveDeclaration || historyData.ReserveDeclaration.length === 0) && (
                        <p className="text-[10px] text-slate-600 italic text-center py-2">Sin registros históricos aún.</p>
                      )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/40 rounded-3xl p-10 border border-slate-800/50 text-center space-y-4">
                <div className="text-4xl">🔭</div>
                <p className="text-sm text-slate-400">
                  No se encontró ningún certificado con el ID <b className="text-white">#{lookupId}</b>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info panel/Link to Dashboard */}
        <div className="group relative flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-900/20 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/5 overflow-hidden transition-all hover:border-emerald-500/20">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40 opacity-0 group-hover:opacity-100 transition-all"></div>
          <div className="text-center sm:text-left relative z-10">
            <span className="text-xs font-bold text-white block mb-1">¿Eres una Persona Calificada (QP)?</span>
            <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Acceso exclusivo para registro técnico.</span>
          </div>
          <Link
            href="/dashboard"
            className="btn btn-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-black rounded-2xl px-6 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            Panel QP →
          </Link>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="relative mt-20 text-center space-y-3 opacity-60 hover:opacity-100 transition-opacity">
        <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-slate-700 to-transparent mx-auto mb-6"></div>
        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          Contrato Inteligente
          <br />
          <code className="text-slate-300 bg-white/5 px-3 py-1 rounded-full mt-2 inline-block">
            0x21d2f82d8aa4e33e55a0b60b12ce0c334c387e6d
          </code>
        </p>
        <p className="text-[10px] text-slate-600 font-bold">
          TOTAL DE ACTIVOS REGISTRADOS: <span className="text-emerald-500">{nextTokenId?.toString() ?? "0"}</span>
        </p>
      </div>
    </div>
  );
};

export default Home;
