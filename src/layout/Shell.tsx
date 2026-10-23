import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { RadarMark } from "./RadarMark";

type Props = {
  entryId: string;
  children: ReactNode;
};

export function Shell({ entryId, children }: Props) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to={`/${entryId}`}>
          <RadarMark />
          <span className="brand-name">FPL Radar</span>
        </Link>
        <nav className="nav">
          <NavLink to={`/${entryId}`} end>
            Squad
          </NavLink>
          <span className="soon" title="Coming later">
            Transfers
          </span>
          <span className="soon" title="Coming later">
            Plan
          </span>
        </nav>
      </header>
      {children}
    </div>
  );
}
