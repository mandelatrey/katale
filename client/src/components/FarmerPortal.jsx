import FarmerApp from '../farmer/FarmerApp';

export default function FarmerPortal({ user, onLogout }) {
  return <FarmerApp user={user} onLogout={onLogout} />;
}
