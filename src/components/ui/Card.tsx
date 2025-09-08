import * as React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl shadow p-6">{children}</div>;
}
