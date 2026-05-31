import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-600">
          <Compass size={30} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <p className="mt-2 text-slate-500">
          This page wandered off the path. Let’s get you back.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Browse sessions
        </Link>
      </div>
    </div>
  );
}
