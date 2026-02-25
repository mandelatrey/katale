import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const commodityColors = {
  maize: '#eab308',
  beans: '#dc2626',
  coffee: '#78350f',
  matooke: '#16a34a',
  rice: '#f5f5f4',
  groundnuts: '#d97706',
  cassava: '#a16207',
  sweet_potatoes: '#ea580c',
  sorghum: '#65a30d',
  millet: '#059669'
};

const commodityBorders = {
  maize: '#ca8a04',
  beans: '#b91c1c',
  coffee: '#451a03',
  matooke: '#15803d',
  rice: '#a8a29e',
  groundnuts: '#b45309',
  cassava: '#854d0e',
  sweet_potatoes: '#c2410c',
  sorghum: '#4d7c0f',
  millet: '#047857'
};

export default function PriceChart({ prices }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !prices.length) return;

    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    const grouped = {};

    prices.forEach(p => {
      if (!grouped[p.commodity]) grouped[p.commodity] = [];
      grouped[p.commodity].push({
        x: new Date(p.recordedAt).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' }),
        y: p.price
      });
    });

    const datasets = Object.entries(grouped).map(([commodity, data]) => ({
      label: commodity.replace('_', ' '),
      data: data.sort((a, b) => new Date(a.x) - new Date(b.x)),
      borderColor: commodityBorders[commodity] || '#6b7280',
      backgroundColor: (commodityColors[commodity] || '#9ca3af') + '20',
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 5,
      borderWidth: 2,
      fill: false
    }));

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              font: { size: 10, family: 'Inter' },
              padding: 8,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleFont: { size: 11, family: 'Inter' },
            bodyFont: { size: 11, family: 'Inter' },
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} UGX/kg`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 7,
              font: { size: 10, family: 'Inter' },
              color: '#9ca3af'
            },
            grid: { display: false }
          },
          y: {
            ticks: {
              font: { size: 10, family: 'Inter' },
              color: '#9ca3af',
              callback: (val) => val.toLocaleString()
            },
            grid: { color: '#f3f4f6' },
            title: {
              display: true,
              text: 'UGX / kg',
              font: { size: 10, family: 'Inter' },
              color: '#9ca3af'
            }
          }
        }
      }
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [prices]);

  if (!prices.length) {
    return (
      <div className="loading" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        No price data available
      </div>
    );
  }

  return (
    <div className="chart-container" style={{ position: 'relative', width: '100%' }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}