import React, { useState, useEffect } from "react";
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
import Security from "./pages/Security";
import MyProfile from "./pages/MyProfile";

function App() {

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [activePage, setActivePage] =
    useState("overview");

  const location = useLocation();

  /* =========================
     CHECK LOGIN SESSION
  ========================= */

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (token) {
      setIsAuthenticated(true);
    }

  }, []);

  /* =========================
     ACTIVE PAGE SYNC
  ========================= */

  useEffect(() => {
  const path = location.pathname.replace("/", "");
  
  // Jika path kosong (halaman utama), set activePage ke "overview"
  if (!path) {
    setActivePage("overview");
  } else if (path !== "login") {
    setActivePage(path);
  }
}, [location]);

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

    <div className="flex bg-[#f8fafc] min-h-screen w-full overflow-x-hidden font-sans text-slate-900">

      {/* SIDEBAR */}

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() =>
          setIsSidebarOpen(!isSidebarOpen)
        }
        activePage={activePage}
        setActivePage={setActivePage}
        onLogin={setIsAuthenticated}
      />

      {/* MAIN CONTENT */}

      <main
        className={`
          flex-1 min-h-screen transition-all duration-500
          ${isSidebarOpen ? "pl-64" : "pl-20"}
        `}
      >

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">

          {/* HEADER */}

          <Header
            activePage={activePage}
            onLogin={setIsAuthenticated}
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
                element={<Security />}
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