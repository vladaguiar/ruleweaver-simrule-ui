import React, { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Scenarios } from "./components/Scenarios";
import { SimulationRunner } from "./components/SimulationRunner";
import { Results } from "./components/Results";
import { Coverage } from "./components/Coverage";
import { Datasets } from "./components/Datasets";
import { Settings } from "./components/Settings";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "scenarios":
        return <Scenarios />;
      case "simulations":
        return <SimulationRunner />;
      case "results":
        return <Results />;
      case "coverage":
        return <Coverage />;
      case "datasets":
        return <Datasets />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      {renderPage()}
    </Layout>
  );
}