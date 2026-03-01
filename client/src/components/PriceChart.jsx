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

export default function PriceChart({ prices, isMobile, currency = 'UGX' }) {
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
        y: currency === 'USD' ? p.price / 3700 : p.price
      });
    });

    const datasets = Object.entries(grouped).map(([commodity, data]) => ({
      label: commodity.replace('_', ' '),
      data: data.sort((a, b) => new Date(a.x) - new Date(b.x)),
      borderColor: commodityBorders[commodity] || '#6b7280',
      backgroundColor: (commodityColors[commodity] || '#9ca3af') + '20',
      tension: 0.4,
      pointRadius: isMobile ? 0 : 2, // Hide dots by default on mobile for cleaner look
      pointHoverRadius: isMobile ? 3 : 5,
      borderWidth: isMobile ? 1.5 : 2,
      fill: false
    }));

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: isMobile ? 'nearest' : 'index',
          intersect: isMobile ? true : false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleFont: { size: isMobile ? 10 : 11, family: 'Inter' },
            bodyFont: { size: isMobile ? 10 : 11, family: 'Inter' },
            padding: isMobile ? 6 : 10,
            cornerRadius: 6,
            displayColors: !isMobile,
            callbacks: {
              label: (ctx) => {
                const val = currency === 'USD' ? ctx.parsed.y.toFixed(2) : ctx.parsed.y.toLocaleString();
                return `${isMobile ? '' : ctx.dataset.label + ': '}${val}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: isMobile ? 5 : 7,
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
            grid: { color: isMobile ? 'transparent' : '#f3f4f6' },
            title: {
              display: !isMobile,
              text: `${currency} / kg`,
              font: { size: 10, family: 'Inter' },
              color: '#9ca3af'
            }
          }
        }
      }
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [prices, isMobile, currency]);

  if (!prices.length) {
    return (
      <div className="loading" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        No price data available
      </div>
    );
  }

  const uniqueCommodities = [...new Set(prices.map(p => p.commodity))].sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div className="chart-container" style={{ position: 'relative', width: '100%', height: isMobile ? 160 : 240 }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      
      {/* Custom HTML Legend */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '6px 12px', 
        marginTop: 16,
        padding: '0 8px'
      }}>
        {uniqueCommodities.map(commodity => (
          <div key={commodity} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: (commodityColors[commodity] || '#9ca3af') + '80', // Slightly transparent to match fill
              border: `2px solid ${commodityBorders[commodity] || '#6b7280'}`,
              flexShrink: 0
            }} />
            <span style={{ fontSize: 10, color: '#4b5563', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {commodity.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}