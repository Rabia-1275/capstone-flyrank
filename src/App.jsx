import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SettingsPage from './pages/SettingsPage';

function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Welcome to Capstone</h1>
      <p className="mt-2 text-sm text-slate-600">
        Use the navigation above to open the settings form and update your profile.
      </p>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}
