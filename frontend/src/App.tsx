import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import AuditTrail from './pages/AuditTrail'
import CommandCenter, { ExecutionTrace } from './pages/CommandCenter'
import Customers from './pages/Customers'
import Datasets from './pages/Datasets'
import Investigations from './pages/Investigations'
import ModelCard from './pages/ModelCard'
import PolicySettings from './pages/PolicySettings'
import ReviewQueue from './pages/ReviewQueue'
import Transactions from './pages/Transactions'
import './App.css'
import './Workspace.css'

export { ExecutionTrace }

export default function App() {
  return (
    <BrowserRouter>
      <div className="workspace-shell">
        <Sidebar />
        <div className="workspace-content">
          <Routes>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/queue" element={<ReviewQueue />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/model" element={<ModelCard />} />
            <Route path="/audit" element={<AuditTrail />} />
            <Route path="/policy" element={<PolicySettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
