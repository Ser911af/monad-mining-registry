"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address, AddressInput, Balance } from "~~/components/scaffold-eth";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const STANDARDS = ["NI 43-101 (Canadá)", "ECRR 2018 (Colombia)"];
const CATEGORIES = ["INFERRED", "INDICATED", "MEASURED"];
const RESERVE_CATEGORIES = ["NONE", "PROBABLE", "PROVED"];

interface Certificate {
  tokenId: number;
  titleId: string;
  standard: number;
  category: number;
  reserveCategory: number;
  cutOffGradeBps: bigint;
  tonnage: bigint;
  polygonGeoHash: string;
  qp: string;
  updatedAt: bigint;
}

const Dashboard: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- Profile / Querying States ---
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);

  // --- Registration Form States ---
  const [titleId, setTitleId] = useState("");
  const [standard, setStandard] = useState(0);
  const [category, setCategory] = useState(0);
  const [cutOff, setCutOff] = useState("");
  const [tonnage, setTonnage] = useState("");
  const [geoHash, setGeoHash] = useState("");

  // --- Admin Form States ---
  const [newQPAddress, setNewQPAddress] = useState("");
  const [adminStandard, setAdminStandard] = useState(0);

  // --- Contract Reads ---
  const { data: nextTokenId, refetch: refetchNextTokenId } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "nextTokenId",
  });

  const { data: isQP } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "whitelistedQP",
    args: [connectedAddress],
  });

  const { data: ownerAddress } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "owner",
  });

  const { data: miningRegistryContract } = useScaffoldContract({
    contractName: "MiningRegistry",
  });

  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "MiningRegistry",
  });

  // Client-side certificates querying loop
  useEffect(() => {
    let isMounted = true;
    const fetchCertificates = async () => {
      if (!miningRegistryContract || nextTokenId === undefined) return;
      setIsLoadingCerts(true);
      const list: Certificate[] = [];
      const limit = Number(nextTokenId);

      for (let i = 1; i <= limit; i++) {
        try {
          const cert = await miningRegistryContract.read.getCertificate([BigInt(i)]);
          if (cert && isMounted) {
            list.push({
              tokenId: i,
              titleId: cert.titleId,
              standard: Number(cert.standard),
              category: Number(cert.category),
              reserveCategory: Number(cert.reserveCategory),
              cutOffGradeBps: cert.cutOffGradeBps,
              tonnage: cert.tonnage,
              polygonGeoHash: cert.polygonGeoHash,
              qp: cert.qp,
              updatedAt: cert.updatedAt,
            });
          }
        } catch {
          // Gracefully skip tokens that do not exist or reverted
        }
      }
      if (isMounted) {
        setCerts(list);
        setIsLoadingCerts(false);
      }
    };

    fetchCertificates();
    return () => {
      isMounted = false;
    };
  }, [miningRegistryContract, nextTokenId, refreshTrigger]);

  const safeBig = (v: string) => {
    try {
      return BigInt(v || "0");
    } catch {
      return 0n;
    }
  };

  // Validations
  const isTonnageValid = tonnage && Number(tonnage) > 0;
  const isCutOffValid = cutOff && Number(cutOff) >= 0;
  const isTitleIdValid = titleId.trim() !== "";
  const isGeoHashValid = geoHash.trim() !== "";
  const isFormValid = isTonnageValid && isCutOffValid && isTitleIdValid && isGeoHashValid;

  const isAdminValid = newQPAddress && newQPAddress.trim() !== "";

  // Write Actions
  const handleRegister = async () => {
    if (!isFormValid) return;
    try {
      await writeContractAsync({
        functionName: "registerCertificate",
        args: [titleId, standard, category, safeBig(cutOff), safeBig(tonnage), geoHash],
      });
      setTitleId("");
      setCutOff("");
      setTonnage("");
      setGeoHash("");
      await refetchNextTokenId();
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error("Error registering certificate:", e);
    }
  };

  const handleAdvance = async (tokenId: number, currentCategory: number) => {
    if (currentCategory >= 2) return;
    try {
      await writeContractAsync({
        functionName: "advanceCategory",
        args: [BigInt(tokenId), currentCategory + 1],
      });
      await refetchNextTokenId();
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error("Error advancing category:", e);
    }
  };

  const handleDeclareReserves = async (tokenId: number, newReserveCategory: number) => {
    try {
      await writeContractAsync({
        functionName: "declareReserves",
        args: [BigInt(tokenId), newReserveCategory],
      });
      await refetchNextTokenId();
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error("Error declaring reserves:", e);
    }
  };

  const handleWhitelist = async () => {
    if (!isAdminValid) return;
    try {
      await writeContractAsync({
        functionName: "whitelistQP",
        args: [newQPAddress],
      });
      setNewQPAddress("");
    } catch (e) {
      console.error("Error whitelisting QP:", e);
    }
  };

  // Filter QP certificates
  const qpCerts = certs.filter(c => c.qp.toLowerCase() === connectedAddress?.toLowerCase());
  const isOwner = connectedAddress && ownerAddress && connectedAddress.toLowerCase() === ownerAddress.toLowerCase();

  // Role-based Access Control
  if (connectedAddress && !isQP && !isOwner) {
    return (
      <div className="flex flex-col grow items-center justify-center px-5 py-20 bg-slate-950 text-white min-h-[80vh]">
        <div className="card w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-red-500/30 shadow-2xl p-8 rounded-2xl text-center shadow-red-950/20">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 animate-pulse">
              <span className="text-4xl">⚠️</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your wallet address is not authorized in the Mining Registry. You must be a whitelisted Qualified Person
            (QP) or the contract Owner to access this dashboard.
          </p>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-left mb-6">
            <span className="text-xs text-slate-500 block mb-1">Your Wallet Address</span>
            <Address address={connectedAddress} />
          </div>
          <Link
            href="/"
            className="btn btn-outline border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white rounded-full w-full transition-all duration-300"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!connectedAddress) {
    return (
      <div className="flex flex-col grow items-center justify-center px-5 py-20 bg-slate-950 text-white min-h-[80vh]">
        <div className="card w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl p-8 rounded-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20">
              <span className="text-4xl">🔌</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-200 mb-2">Connect Wallet</h2>
          <p className="text-slate-400 text-sm mb-4">
            Please connect your Web3 wallet to access the Qualified Person (QP) dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 px-4 py-8 md:px-8 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <span className="text-2xl text-emerald-400">🛡️</span>
              </div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                Acceso Autorizado
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Panel de <span className="text-emerald-400">Control QP</span>
            </h1>
            <p className="text-slate-500 text-sm max-w-md font-medium uppercase tracking-wider">
              Interfaz técnica para registro de activos y escalamiento de recursos.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/5 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
              <span className="text-[10px] text-slate-300 font-black tracking-widest uppercase">Monad Testnet</span>
            </div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter mr-2">
              Arquitectura Pionera Mobile-First
            </span>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Profile Card + Admin Panel */}
          <div className="lg:col-span-1 space-y-10">
            {/* Whitelist Status Profile Card */}
            {isQP && (
              <div className="card bg-slate-900/30 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden transition-all hover:border-white/20">
                <div className="bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent px-8 py-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-black text-white text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="text-xl">👤</span> Perfil QP
                  </h3>
                  <div className="px-3 py-1 bg-emerald-500 text-slate-950 text-[9px] font-black rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    ACTIVO
                  </div>
                </div>
                <div className="p-8 space-y-8">
                  {/* Address Display */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block ml-1">Dirección Autorizada</span>
                    <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/50 transition-all hover:bg-slate-950/60">
                      <Address address={connectedAddress} />
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block ml-1">Balance de Billetera</span>
                    <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/50 flex justify-between items-center">
                      <Balance address={connectedAddress} className="text-sm font-bold text-slate-200" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-5 rounded-3xl border border-slate-800/50 text-center flex flex-col justify-center items-center group hover:bg-emerald-500/5 transition-colors">
                      <span className="text-3xl block mb-2 opacity-80 group-hover:scale-110 transition-transform">✍️</span>
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Firmados</span>
                      {isLoadingCerts ? (
                        <span className="loading loading-spinner loading-xs text-slate-700" />
                      ) : (
                        <span className="text-2xl font-black text-white">{qpCerts.length}</span>
                      )}
                    </div>
                    <div className="bg-slate-950/40 p-5 rounded-3xl border border-slate-800/50 text-center flex flex-col justify-center items-center group hover:bg-blue-500/5 transition-colors">
                      <span className="text-3xl block mb-2 opacity-80 group-hover:scale-110 transition-transform">📋</span>
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Estándares</span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Owner-only Admin Panel */}
            {isOwner && (
              <div className="card bg-slate-900/20 backdrop-blur-3xl border border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden hover:border-white/10 transition-all">
                <div className="bg-gradient-to-br from-blue-500/20 via-transparent to-transparent px-8 py-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-black text-white text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="text-xl">⚙️</span> Administración
                  </h3>
                  <div className="px-3 py-1 bg-blue-500 text-white text-[9px] font-black rounded-lg">
                    OWNER
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Autoriza nuevas Personas Calificadas (QP) para otorgar permisos de registro.
                  </p>

                  <div className="space-y-3">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Wallet del QP</label>
                    <div className="bg-slate-950/40 rounded-2xl p-1 border border-slate-800/50">
                      <AddressInput value={newQPAddress} placeholder="0x..." onChange={val => setNewQPAddress(val)} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Estándar Base</label>
                    <select
                      className="select select-bordered w-full h-14 bg-slate-950/40 border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500/50"
                      value={adminStandard}
                      onChange={e => setAdminStandard(Number(e.target.value))}
                    >
                      {STANDARDS.map((s, i) => (
                        <option key={i} value={i}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="btn bg-blue-600 hover:bg-blue-500 w-full h-14 mt-4 rounded-2xl text-white font-black border-none shadow-lg transition-all active:scale-95"
                    disabled={isMining || !isAdminValid}
                    onClick={handleWhitelist}
                  >
                    {isMining ? <span className="loading loading-spinner loading-sm" /> : "AUTORIZAR QP"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Certificate Registration Form */}
          <div className="lg:col-span-2 space-y-8">
            {isQP ? (
              <div className="card bg-slate-900/30 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <div className="bg-slate-900/60 px-10 py-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="text-2xl">✍️</span> Registro de Certificado
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">NFT Técnico Inmutable</span>
                </div>
                <div className="p-10 space-y-8">
                  {/* Grid fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">ID del Título</label>
                      <input
                        className="input input-bordered w-full h-14 bg-slate-950/40 border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-500/50"
                        placeholder="Ej: CO-2026-LITIO-001"
                        value={titleId}
                        onChange={e => setTitleId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">
                        GeoHash del Polígono
                      </label>
                      <input
                        className="input input-bordered w-full h-14 bg-slate-950/40 border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-500/50"
                        placeholder="Ej: d2g6f8q9b"
                        value={geoHash}
                        onChange={e => setGeoHash(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Estándar Técnico</label>
                      <select
                        className="select select-bordered w-full h-14 bg-slate-950/40 border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-500/50"
                        value={standard}
                        onChange={e => setStandard(Number(e.target.value))}
                      >
                        {STANDARDS.map((s, i) => (
                          <option key={i} value={i}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">
                        Categoría Inicial
                      </label>
                      <select
                        className="select select-bordered w-full h-14 bg-slate-950/40 border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-500/50"
                        value={category}
                        onChange={e => setCategory(Number(e.target.value))}
                      >
                        {CATEGORIES.map((c, i) => (
                          <option key={i} value={i}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">
                        Ley de Corte (bps)
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="input input-bordered w-full h-14 bg-slate-950/40 border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-500/50"
                        placeholder="Ej: 50"
                        value={cutOff}
                        onChange={e => setCutOff(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">
                        Tonelaje (Tons)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input input-bordered w-full h-14 bg-slate-950/40 border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-500/50"
                        placeholder="Ej: 1,000,000"
                        value={tonnage}
                        onChange={e => setTonnage(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    className="btn bg-emerald-500 hover:bg-emerald-400 w-full h-16 mt-6 rounded-[1.5rem] text-slate-950 font-black text-lg tracking-wider border-none shadow-[0_15px_30px_-10px_rgba(16,185,129,0.4)] disabled:bg-slate-800 disabled:text-slate-600 transition-all active:scale-[0.98]"
                    disabled={isMining || !isFormValid}
                    onClick={handleRegister}
                  >
                    {isMining ? <span className="loading loading-spinner loading-md" /> : "FIRMAR Y REGISTRAR CERTIFICADO"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card bg-slate-900/30 backdrop-blur-3xl border border-white/5 p-12 rounded-[2.5rem] text-center flex flex-col justify-center items-center h-full space-y-6">
                <div className="text-6xl animate-bounce">🏗️</div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">Dashboard de Propietario</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">
                  Has iniciado sesión como Propietario del Contrato. Utiliza el panel lateral para autorizar a 
                  Personas Calificadas (QP). Solo los QPs autorizados pueden registrar activos mineros.
                </p>
                <div className="w-20 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>
              </div>
            )}
          </div>
        </div>

        {/* Full-width Resource Escalator Table */}
        {isQP && (
          <div className="card bg-slate-900/20 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-slate-900/40 px-10 py-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-black text-white text-xs uppercase tracking-[0.3em] flex items-center gap-4">
                <span className="text-2xl">📈</span> Gestión de Activos Firmados
              </h3>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
              </div>
            </div>

            <div className="p-8">
              {isLoadingCerts ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <span className="loading loading-spinner loading-lg text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando con Monad...</span>
                </div>
              ) : qpCerts.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <span className="text-5xl block opacity-40">📂</span>
                  <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">No se encontraron activos asociados a esta firma.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        <th className="py-6 px-6">ID Token</th>
                        <th className="py-6 px-6">Identificador</th>
                        <th className="py-6 px-6">Norma</th>
                        <th className="py-6 px-6 text-center">Progreso de Certificación</th>
                        <th className="py-6 px-6 text-right">Operaciones Técnicas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {qpCerts.map(cert => {
                        const canDeclareProbable =
                          cert.reserveCategory === 0 && (cert.category === 1 || cert.category === 2);
                        const canDeclareProved = cert.reserveCategory < 2 && cert.category === 2;

                        return (
                          <tr key={cert.tokenId} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="py-8 px-6">
                              <span className="font-mono text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                #{cert.tokenId}
                              </span>
                            </td>
                            <td className="py-8 px-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-white">{cert.titleId}</span>
                                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">GeoHash: {cert.polygonGeoHash}</span>
                              </div>
                            </td>
                            <td className="py-8 px-6">
                              <span className="text-[10px] font-black text-slate-400 border border-slate-800 px-2 py-1 rounded-md uppercase">
                                {cert.standard === 0 ? "NI 43-101" : "ECRR 2018"}
                              </span>
                            </td>

                            {/* Combined Category & Reserves Display */}
                            <td className="py-8 px-6 text-center">
                              <div className="flex flex-col gap-4 items-center">
                                {/* Resource Escalator Steps */}
                                <div className="flex items-center gap-2 justify-center">
                                  {CATEGORIES.map((catName, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <div className="relative">
                                        {idx < cert.category && (
                                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full blur-[2px] animate-pulse"></div>
                                        )}
                                        <span
                                          className={`text-[9px] font-black px-3 py-1 rounded-full transition-all duration-500 ${
                                            idx <= cert.category
                                              ? idx === 0
                                                ? "bg-slate-700 text-slate-200 border border-slate-600"
                                                : idx === 1
                                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                              : "bg-slate-950 text-slate-700 border border-slate-900 opacity-40"
                                          }`}
                                        >
                                          {catName}
                                        </span>
                                      </div>
                                      {idx < 2 && (
                                        <div className={`w-4 h-[1px] ${idx < cert.category ? 'bg-emerald-500/40' : 'bg-slate-800'}`}></div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {/* Reserve Badges */}
                                <div className="flex gap-2">
                                  {cert.reserveCategory > 0 && (
                                    <span
                                      className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${
                                        cert.reserveCategory === 1
                                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                          : "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                      }`}
                                    >
                                      RESERVA {RESERVE_CATEGORIES[cert.reserveCategory]}
                                    </span>
                                  )}
                                  <span className="text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest bg-slate-950 text-slate-600 border border-slate-900">
                                    Soulbound
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-8 px-6 text-right">
                              <div className="flex flex-col gap-2 items-end">
                                {cert.category < 2 && (
                                  <button
                                    className="btn btn-xs h-8 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-slate-950 border border-amber-500/20 transition-all rounded-xl w-full max-w-[160px] font-black text-[9px] uppercase tracking-wider"
                                    disabled={isMining}
                                    onClick={() => handleAdvance(cert.tokenId, cert.category)}
                                  >
                                    ESCALAR A {CATEGORIES[cert.category + 1]}
                                  </button>
                                )}

                                {canDeclareProbable && (
                                  <button
                                    className="btn btn-xs h-8 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-500/20 transition-all rounded-xl w-full max-w-[160px] font-black text-[9px] uppercase tracking-wider"
                                    disabled={isMining}
                                    onClick={() => handleDeclareReserves(cert.tokenId, 1)}
                                  >
                                    DECLARAR PROBABLE
                                  </button>
                                )}

                                {canDeclareProved && (
                                  <button
                                    className="btn btn-xs h-8 bg-purple-500/10 hover:bg-purple-500 text-purple-500 hover:text-white border border-purple-500/20 transition-all rounded-xl w-full max-w-[160px] font-black text-[9px] uppercase tracking-wider"
                                    disabled={isMining}
                                    onClick={() => handleDeclareReserves(cert.tokenId, 2)}
                                  >
                                    DECLARAR PROBADA
                                  </button>
                                )}

                                {cert.category >= 2 && cert.reserveCategory >= 2 && (
                                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                                    <span className="text-xs font-black uppercase tracking-widest">CERTIFICACIÓN TOTAL</span>
                                    <span className="text-lg">✓</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
};

export default Dashboard;
