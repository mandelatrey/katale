import { useState, useEffect } from "react";

const API_URL = "/api";

export function usePayments(filters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(filters).toString();
    fetch(`${API_URL}/payments${params ? "?" + params : ""}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch payments");
        return r.json();
      })
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
}

export function usePaymentStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/payments/stats`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch payment stats");
        return r.json();
      })
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
