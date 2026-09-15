import { storeConfig } from '@/config/site';

/** Total units across sizes: "Sold out", "Low · 3" or "24 in stock". */
export default function StockPill({ total }) {
  if (total <= 0) return <span className="status-pill tone-danger">Sold out</span>;
  if (total <= storeConfig.lowStockThreshold) return <span className="status-pill tone-warning">Low · {total}</span>;
  return <span className="status-pill tone-success">{total} in stock</span>;
}
