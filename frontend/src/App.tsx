import { Routes, Route, Navigate } from "react-router-dom";
import AuthenticationPage from "./pages/Authentication";
import VotePage from "./pages/Vote";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthenticationPage />} />
      <Route
        path="/vote"
        element={
          <ProtectedRoute>
            <VotePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
