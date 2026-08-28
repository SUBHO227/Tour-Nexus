import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

import Profile from './pages/tourist/Profile';
import DestinationPreferences from './pages/tourist/DestinationPreferences';
import ItineraryGeneration from './pages/tourist/ItineraryGeneration';
import InteractiveMap from './pages/tourist/InteractiveMap';
import CurrentItinerary from './pages/tourist/CurrentItinerary';
import DisruptionAlerts from './pages/tourist/DisruptionAlerts';
import ImpactView from './pages/tourist/ImpactView';
import Alternatives from './pages/tourist/Alternatives';
import UpdatedItinerary from './pages/tourist/UpdatedItinerary';

import Overview from './pages/authority/Overview';
import DestinationMap from './pages/authority/DestinationMap';
import ActiveDisruptions from './pages/authority/ActiveDisruptions';
import DependencyGraphPage from './pages/authority/DependencyGraphPage';
import RippleEffect from './pages/authority/RippleEffect';
import ImpactAnalysis from './pages/authority/ImpactAnalysis';
import Interventions from './pages/authority/Interventions';
import AffectedTourists from './pages/authority/AffectedTourists';
import AffectedItineraries from './pages/authority/AffectedItineraries';

function RequireAuth({
  role,
  children,
}: {
  role?: 'tourist' | 'authority';
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-400" />
          <p className="text-xs text-mist-400">Restoring session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // An authority landing on the tourist app (or the reverse) is sent to
  // the console that matches their role rather than shown an error.
  if (role && user.role !== role) {
    return (
      <Navigate to={user.role === 'authority' ? '/authority' : '/app'} replace />
    );
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user, ready } = useAuth();

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Navigate to={user.role === 'authority' ? '/authority' : '/app'} replace />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/app"
        element={
          <RequireAuth role="tourist">
            <Layout variant="tourist" />
          </RequireAuth>
        }
      >
        <Route index element={<Profile />} />
        <Route path="destinations" element={<DestinationPreferences />} />
        <Route path="generate" element={<ItineraryGeneration />} />
        <Route path="map" element={<InteractiveMap />} />
        <Route path="itinerary" element={<CurrentItinerary />} />
        <Route path="disruptions" element={<DisruptionAlerts />} />
        <Route path="impact" element={<ImpactView />} />
        <Route path="alternatives" element={<Alternatives />} />
        <Route path="updated" element={<UpdatedItinerary />} />
      </Route>

      <Route
        path="/authority"
        element={
          <RequireAuth role="authority">
            <Layout variant="authority" />
          </RequireAuth>
        }
      >
        <Route index element={<Overview />} />
        <Route path="map" element={<DestinationMap />} />
        <Route path="disruptions" element={<ActiveDisruptions />} />
        <Route path="graph" element={<DependencyGraphPage />} />
        <Route path="ripple" element={<RippleEffect />} />
        <Route path="impact" element={<ImpactAnalysis />} />
        <Route path="interventions" element={<Interventions />} />
        <Route path="tourists" element={<AffectedTourists />} />
        <Route path="itineraries" element={<AffectedItineraries />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
