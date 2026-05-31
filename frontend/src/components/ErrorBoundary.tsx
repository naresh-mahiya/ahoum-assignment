import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
          <div className="card max-w-md p-8">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600">
              <AlertTriangle size={26} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Something broke</h1>
            <p className="mt-2 text-sm text-slate-500">
              {this.state.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.assign('/')}
              className="btn-primary mt-6"
            >
              Return home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
