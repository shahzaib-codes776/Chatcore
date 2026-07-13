import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";

function isLoggedIn() {
  return !!localStorage.getItem("chatcore_token");
}

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn() ? <Navigate to="/dashboard" replace /> : <AuthPage />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
