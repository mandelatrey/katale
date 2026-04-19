import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { X, TrendingUp } from './Icons';
import * as insightsApi from '../api/insights.js';

export default function InsightsPanel({ onClose }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const data = await insightsApi.listInsights();
        setInsights(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  return (
    <div className="fixed top-0 right-0 w-[400px] h-full bg-white shadow-2xl z-100 flex flex-col border-l border-gray-200 overflow-hidden"
         style={{ zIndex: 1000, boxShadow: '-5px 0 25px rgba(0,0,0,0.1)' }}>
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-700" /> Market Insights
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && <p className="text-sm text-gray-500 text-center py-4">Loading insights...</p>}
        {error && <p className="text-sm text-red-500 text-center py-4">{error}</p>}
        
        {!loading && !error && insights.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No insights available.</p>
        )}

        {insights.map((insight, index) => (
          <Card key={insight._id || index} className="overflow-hidden">
            <CardHeader className="bg-gray-50 pb-2">
              <CardTitle className="text-sm leading-tight">{insight.title}</CardTitle>
              {insight.price && (
                <div className="text-xs font-semibold text-green-600 mt-1">
                  {insight.price}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                {insight.summary}
              </p>
              <div className="mt-3 text-[10px] text-gray-400 font-medium">
                Source: {insight.source}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
