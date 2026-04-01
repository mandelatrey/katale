export default function SkeletonRow({ cols }) {
  return (
    <tr style={{ borderBottom: '1px solid #f9fafb' }}>
      {Array(cols).fill(0).map((_, j) => (
        <td key={j} style={{ padding: '12px 16px' }}>
          <div className="dash-skeleton" style={{ height: 14, borderRadius: 4, width: j === 0 ? 90 : 70 }} />
        </td>
      ))}
    </tr>
  );
}
