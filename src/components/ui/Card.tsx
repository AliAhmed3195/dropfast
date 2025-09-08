import * as React from "react";

export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <div className={`bg-white rounded-2xl shadow p-6 ${className}`} onClick={onClick}>{children}</div>;
}
