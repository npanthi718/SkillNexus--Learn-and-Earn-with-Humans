import React, { useEffect, useState } from "react";

export const useIsXS = () => {
  const [xs, setXs] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 480px)");
    const fn = () => setXs(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return xs;
};

const ResponsiveTableCards = ({ headers, rows, renderCell, renderActions, title }) => {
  const xs = useIsXS();
  if (!rows || rows.length === 0) return null;
  if (!xs) {
    return (
      <div className="overflow-auto overflow-x-auto">
        <table className="min-w-[800px] border-collapse text-left text-xs">
          {title ? <caption className="text-left text-xs theme-muted mb-2">{title}</caption> : null}
          <thead className="sticky top-0 bg-nexus-900/95 text-[11px] text-white/60">
            <tr>
              {headers.map((h) => (
                <th key={h.key} className="border-b border-white/10 px-3 py-2">{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row._id || idx} className="hover:bg-white/5">
                {headers.map((h) => (
                  <td key={h.key} className="border-b border-white/5 px-3 py-2">
                    {renderCell(h, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      {rows.map((row, idx) => (
        <article key={row._id || idx} className="glass-card p-3">
          <div className="grid gap-1 text-xs">
            {headers.map((h) => (
              <div key={h.key} className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-white/60">{h.label}</span>
                <div className="text-right">{renderCell(h, row)}</div>
              </div>
            ))}
          </div>
          {renderActions ? (
            <div className="mt-2 flex items-center gap-2">
              {renderActions(row)}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
};

export default ResponsiveTableCards;
