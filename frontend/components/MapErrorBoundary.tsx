"use client";

import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-100 text-center p-8">
          <div>
            <p className="text-2xl mb-2">🗺️</p>
            <p className="font-semibold text-gray-700">La carte est temporairement indisponible</p>
            <p className="text-sm text-gray-400 mt-1">Problème de clé Google Maps — réessayez dans quelques minutes.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
