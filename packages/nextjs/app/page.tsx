"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const STANDARDS = ["NI 43-101 (Canadá)", "ECRR 2018 (Colombia)"];
const CATEGORIES = ["INFERRED", "INDICATED", "MEASURED"];
const CATEGORY_BADGE = ["badge-ghost", "badge-warning", "badge-success"];

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // --- formulario de registro ---
  const [titleId, setTitleId] = useState("");
  const [standard, setStandard] = useState(0);
  const [category, setCategory] = useState(0);
  const [cutOff, setCutOff] = useState("");
  const [tonnage, setTonnage] = useState("");
  const [geoHash, setGeoHash] = useState("");

  // --- consulta de certificado ---
  const [lookupId, setLookupId] = useState("1");

  const { data: nextTokenId } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "nextTokenId",
  });

  const { data: isQP } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "whitelistedQP",
    args: [connectedAddress],
  });

  const { data: cert, refetch: refetchCert } = useScaffoldReadContract({
    contractName: "MiningRegistry",
    functionName: "getCertificate",
    args: [lookupId ? BigInt(lookupId) : undefined],
  });

  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "MiningRegistry",
  });

  const safeBig = (v: string) => {
    try {
      return BigInt(v || "0");
    } catch {
      return 0n;
    }
  };

  const handleRegister = async () => {
    await writeContractAsync({
      functionName: "registerCertificate",
      args: [titleId, standard, category, safeBig(cutOff), safeBig(tonnage), geoHash],
    });
    setTitleId("");
    setCutOff("");
    setTonnage("");
    setGeoHash("");
  };

  const handleAdvance = async () => {
    if (!cert) return;
    const current = Number(cert.category);
    if (current >= 2) return;
    await writeContractAsync({
      functionName: "advanceCategory",
      args: [BigInt(lookupId), current + 1],
    });
    await refetchCert();
  };

  const certCategory = cert ? Number(cert.category) : 0;

  return (
    <div className="flex flex-col grow items-center px-5 pt-10 pb-20">
      {/* Hero */}
      <div className="max-w-3xl text-center">
        <span className="badge badge-primary badge-outline mb-3">Monad testnet</span>
        <h1 className="text-4xl font-bold mb-2">⛏️ Monad Mining Registry</h1>
        <p className="text-lg opacity-80">
          Expediente digital <b>inmutable</b> de títulos mineros bajo las normas{" "}
          <b>NI 43-101</b> y <b>ECRR 2018</b>. Cada título es un NFT cuya clasificación de recurso
          solo puede <b>avanzar</b> si la norma lo permite.
        </p>
      </div>

      {/* Estado de conexión */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="opacity-70">Billetera:</span>
          <Address address={connectedAddress} />
        </div>
        {connectedAddress &&
          (isQP ? (
            <span className="badge badge-success gap-1">✓ Persona Calificada (QP) autorizada</span>
          ) : (
            <span className="badge badge-error gap-1">✗ No autorizada para firmar</span>
          ))}
        <span className="text-sm opacity-60">
          Títulos registrados: <b>{nextTokenId?.toString() ?? "…"}</b>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 w-full max-w-5xl">
        {/* Registrar */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">📝 Registrar título minero</h2>
            <p className="text-sm opacity-60 -mt-2">Solo una QP en lista blanca puede firmar.</p>

            <label className="text-sm font-medium mt-2">ID del título</label>
            <input
              className="input input-bordered"
              placeholder="Ej. CO-2024-LITIO-001"
              value={titleId}
              onChange={e => setTitleId(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Norma</label>
                <select
                  className="select select-bordered w-full"
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
              <div>
                <label className="text-sm font-medium">Categoría inicial</label>
                <select
                  className="select select-bordered w-full"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Ley de corte (bps)</label>
                <input
                  className="input input-bordered w-full"
                  placeholder="50"
                  value={cutOff}
                  onChange={e => setCutOff(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tonelaje</label>
                <input
                  className="input input-bordered w-full"
                  placeholder="1000000"
                  value={tonnage}
                  onChange={e => setTonnage(e.target.value)}
                />
              </div>
            </div>

            <label className="text-sm font-medium mt-1">GeoHash del polígono</label>
            <input
              className="input input-bordered"
              placeholder="d2g6f8q..."
              value={geoHash}
              onChange={e => setGeoHash(e.target.value)}
            />

            <button
              className="btn btn-primary mt-3"
              disabled={isMining || !isQP || !titleId}
              onClick={handleRegister}
            >
              {isMining ? <span className="loading loading-spinner loading-sm" /> : "Registrar certificado"}
            </button>
            {!isQP && connectedAddress && (
              <p className="text-xs text-error">Tu billetera no está autorizada como QP.</p>
            )}
          </div>
        </div>

        {/* Consultar / avanzar */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">🔎 Verificar título</h2>
            <p className="text-sm opacity-60 -mt-2">Cualquiera puede verificar al instante.</p>

            <label className="text-sm font-medium mt-2">Token ID</label>
            <input
              className="input input-bordered"
              type="number"
              min="1"
              value={lookupId}
              onChange={e => setLookupId(e.target.value)}
            />

            {cert ? (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-60">Título</span>
                  <b>{cert.titleId}</b>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Norma</span>
                  <span>{STANDARDS[Number(cert.standard)]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-60">Categoría</span>
                  <span className={`badge ${CATEGORY_BADGE[certCategory]}`}>{CATEGORIES[certCategory]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Ley de corte (bps)</span>
                  <span>{cert.cutOffGradeBps?.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Tonelaje</span>
                  <span>{cert.tonnage?.toString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-60">QP firmante</span>
                  <Address address={cert.qp} size="sm" />
                </div>

                {/* Escalera de categorías */}
                <div className="flex items-center gap-2 justify-center mt-3">
                  {CATEGORIES.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`badge ${i <= certCategory ? CATEGORY_BADGE[i] : "badge-ghost opacity-40"}`}>
                        {c}
                      </span>
                      {i < 2 && <span className="opacity-40">→</span>}
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-secondary w-full mt-2"
                  disabled={isMining || !isQP || certCategory >= 2}
                  onClick={handleAdvance}
                >
                  {certCategory >= 2
                    ? "Categoría máxima alcanzada (MEASURED)"
                    : `Avanzar a ${CATEGORIES[certCategory + 1]}`}
                </button>
              </div>
            ) : (
              <p className="text-sm opacity-50 mt-3">
                No existe un título con ese ID (o aún no se ha registrado).
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs opacity-40 mt-10">
        Contrato verificado: 0x21d2f82d8aa4e33e55a0b60b12ce0c334c387e6d · Monad testnet
      </p>
    </div>
  );
};

export default Home;
