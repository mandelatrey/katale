import { useState, useEffect } from "react";
import * as commoditiesApi from "../api/commodities.js";
import * as insightsApi from "../api/insights.js";

export function useLatestPrices(filters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    commoditiesApi
      .latestPrices(filters)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
}

export function useInsights() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    insightsApi
      .listInsights()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
