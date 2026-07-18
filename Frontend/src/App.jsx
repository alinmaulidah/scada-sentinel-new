import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

import LoginPage from "./LoginPage";

import Dashboard from "./pages/Dashboard";
import DataManagement from "./pages/DataManagement";
import AlgorithmExecution from "./pages/AlgorithmExecution";
import Monitoring from "./pages/Monitoring";
import Settings from "./pages/Settings";
import MyProfile from "./pages/MyProfile";
import { applyTheme, getAppSettings } from "./lib/appSettings";

function App() {

  const [isAuthenticated, setIsAuthenticated] =
    useState(() => Boolean(localStorage.getItem("token")));

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const location = useLocation();
  const activePage = location.pathname.slice(1) || "overview";

  useEffect(() => {
    applyTheme(getAppSettings().darkMode);
  }, []);

  /* =========================
     PROTECTED ROUTE
  ========================= */

  if (!isAuthenticated) {

    return (

      <Routes>

        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={() =>
                setIsAuthenticated(true)
              }
            />
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" />}
        />

      </Routes>

    );
  }

  return (

    <div className="flex min-h-screen w-full overflow-x-hidden bg-[#f8fafc] font-sans text-slate-900">

      {/* SIDEBAR */}

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() =>
          setIsSidebarOpen(!isSidebarOpen)
        }
        activePage={activePage}
        onLogin={setIsAuthenticated}
      />

      {/* MAIN CONTENT */}

      <main
        className={`
          min-w-0 flex-1 min-h-screen transition-all duration-500
          pl-0 ${isSidebarOpen ? "md:pl-64" : "md:pl-20"}
        `}
      >

        <div className="w-full max-w-[1600px] p-0 sm:p-4 md:p-8 mx-auto">

          {/* HEADER */}

          <Header
            activePage={activePage}
            onLogin={setIsAuthenticated}
            onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          />

          {/* PAGE CONTENT */}

          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            <Routes>

              <Route
                path="/overview"
                element={<Dashboard />}
              />

              <Route
                path="/datamanagement"
                element={<DataManagement />}
              />

              <Route
                path="/algorithmexecution"
                element={<AlgorithmExecution />}
              />

              <Route
                path="/monitoring"
                element={<Monitoring />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />

              <Route
                path="/security"
                element={<Navigate to="/settings" replace />}
              />

              <Route
                path="/myprofile"
                element={<MyProfile />}
              />

              {/* DEFAULT */}

              <Route
                path="/"
                element={<Navigate to="/overview" />}
              />

              <Route
                path="*"
                element={<Navigate to="/overview" />}
              />

            </Routes>

          </div>

        </div>

      </main>

    </div>
  );
}

export default App;
