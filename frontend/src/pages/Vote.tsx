import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Vote = {
  id: string;
  userId: string;
  choice: "Oui" | "Non";
  _ts: number;
};

const BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_URL}/api/votes`;
const VOTE_URL = `${BASE_URL}/api/vote`;

export default function VotePage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Erreur API");
        const data: Vote[] = await res.json();

        // Trier par timestamp (desc)
        data.sort((a, b) => b._ts - a._ts);

        setVotes(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchVotes();
  }, []);

  if (loading) {
    return <p className="p-6 text-center">Chargement…</p>;
  }

  // Stats
  const total = votes.length;
  const countOui = votes.filter((v) => v.choice === "Oui").length;
  const countNon = votes.filter((v) => v.choice === "Non").length;
  const pctOui = total > 0 ? ((countOui / total) * 100).toFixed(1) : "0";
  const pctNon = total > 0 ? ((countNon / total) * 100).toFixed(1) : "0";

  // Vérifier si l'utilisateur a déjà voté
  const existingVote = user
    ? votes.find((v) => v.userId === user.email)
    : null;

  // Fonction pour voter
  const handleVote = async (choice: "Oui" | "Non") => {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch(VOTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.email,
          choice,
        }),
      });
      if (!res.ok) throw new Error("Erreur API vote");

      const newVote: Vote = await res.json();
      setVotes((prev) => [newVote, ...prev]); // ajoute en tête
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/"); // redirection vers login
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Sondage</h1>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          Déconnexion
        </button>
      </div>

      {/* Question */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">
          Est-ce que François Bayrou nous manque ?
        </h2>
        <p className="text-sm opacity-70">Nombre total de votes : {total}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-bold text-green-600">Oui</h2>
          <p>
            {countOui} ({pctOui}%)
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-bold text-red-600">Non</h2>
          <p>
            {countNon} ({pctNon}%)
          </p>
        </div>
      </div>

      {/* Zone de vote */}
      <div className="p-4 border rounded-lg text-center">
        {existingVote ? (
          <p>
            Tu as déjà voté :{" "}
            <span
              className={`font-bold ${
                existingVote.choice === "Oui"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {existingVote.choice}
            </span>
          </p>
        ) : (
          <div className="space-x-4">
            <button
              onClick={() => handleVote("Oui")}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Oui
            </button>
            <button
              onClick={() => handleVote("Non")}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Non
            </button>
          </div>
        )}
      </div>

      {/* Liste des votes */}
      <div className="space-y-2">
        <h2 className="font-semibold">Détails des votes</h2>
        <ul className="divide-y">
          {votes.map((v) => (
            <li key={v.id} className="flex justify-between py-2">
              <span className="font-mono text-sm">{v.userId}</span>
              <span
                className={`font-semibold ${
                  v.choice === "Oui" ? "text-green-600" : "text-red-600"
                }`}
              >
                {v.choice}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
