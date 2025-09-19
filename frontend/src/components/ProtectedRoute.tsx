import type { JSX } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const user = localStorage.getItem("user"); // récupère l'utilisateur du login

  if (!user) {
    // si pas connecté → redirige vers login
    return <Navigate to="/" replace />;
  }

  return children;
}
