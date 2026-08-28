import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/guards";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Quotes from "./pages/Quotes";
import QuoteEdit from "./pages/QuoteEdit";
import Ndas from "./pages/Ndas";
import NdaEdit from "./pages/NdaEdit";
import Analytics from "./pages/Analytics";
import Projects from "./pages/Projects";
import Domains from "./pages/Domains";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="quotes/new" element={<QuoteEdit />} />
            <Route path="quotes/:id" element={<QuoteEdit />} />
            <Route path="ndas" element={<Ndas />} />
            <Route path="ndas/new" element={<NdaEdit />} />
            <Route path="ndas/:id" element={<NdaEdit />} />
            <Route path="projects" element={<Projects />} />
            <Route path="domains" element={<Domains />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
