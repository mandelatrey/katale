import { useState, useEffect } from "react";

const API_URL = "/api";

export function useCarriers(filters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(filters).toString();
    fetch(`${API_URL}/fleet/carriers${params ? "?" + params : ""}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch carriers");
        return r.json();
      })
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
}

export function useAssets(filters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(filters).toString();
    fetch(`${API_URL}/fleet/assets${params ? "?" + params : ""}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch assets");
        return r.json();
      })
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
}
