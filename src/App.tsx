import React, { useState } from "react";
import { AppProvider } from "./contexts/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Scenarios } from "./components/Scenarios";
import { SimulationRunner } from "./components/SimulationRunner";
import { Results } from "./components/Results";
import { Coverage } from "./components/Coverage";
import { Datasets } from "./components/Datasets";
import { Settings } from "./components/Settings";
import { ScenarioEditor } from "./components/ScenarioEditor";
import { NotificationContainer } from "./components/ui/NotificationToast";
import { DatasetEditor } from "./components/DatasetEditor";

// Page state type for better type safety
type PageType =
  | 'dashboard'
  | 'scenarios'
  | 'scenario-editor'
  | 'simulations'
  | 'results'
  | 'coverage'
  | 'datasets'
  | 'dataset-editor'
  | 'settings';

interface PageState {
  page: PageType;
  params?: {
    scenarioId?: string;
    simulationId?: string;
    datasetId?: string;
  };
}

export default function App() {
  const [pageState, setPageState] = useState<PageState>({ page: "dashboard" });

  const navigate = (page: string, params?: PageState['params']) => {
    setPageState({ page: page as PageType, params });
  };

  const renderPage = () => {
    switch (pageState.page) {
      case "dashboard":
        return <Dashboard onNavigate={navigate} />;
      case "scenarios":
        return <Scenarios onNavigate={navigate} />;
      case "scenario-editor":
        return (
          <ScenarioEditor
            scenarioId={pageState.params?.scenarioId}
            onNavigate={navigate}
            onSave={() => navigate('scenarios')}
            onCancel={() => navigate('scenarios')}
          />
        );
      case "simulations":
        return <SimulationRunner onNavigate={navigate} />;
      case "results":
        return <Results simulationId={pageState.params?.simulationId} onNavigate={navigate} />;
      case "coverage":
        return <Coverage onNavigate={navigate} />;
      case "datasets":
        return <Datasets onNavigate={navigate} />;
      case "dataset-editor":
        return (
          <DatasetEditor
            datasetId={pageState.params?.datasetId}
            onNavigate={navigate}
          />
        );
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <AppProvider>
        <Layout
          currentPage={pageState.page}
          onNavigate={(page) => navigate(page)}
        >
          <ErrorBoundary>
            {renderPage()}
          </ErrorBoundary>
        </Layout>
        <NotificationContainer />
      </AppProvider>
    </ErrorBoundary>
  );
}