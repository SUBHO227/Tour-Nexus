import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();

  const home = user
    ? user.role === 'authority'
      ? '/authority'
      : '/app'
    : '/login';

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="max-w-md text-center">
        <p className="font-mono text-6xl font-extrabold text-brand-500/30">
          404
        </p>
        <h1 className="mt-4 text-xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-mist-400">
          That route is not part of TourNexus. It may have moved when the
          frontend was rebuilt on React Router.
        </p>
        <Link
          to={home}
          className="mt-6 inline-flex items-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Back to the dashboard
        </Link>
      </div>
    </div>
  );
}
