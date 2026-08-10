import { useState } from 'react';
import ConnectNumber from './screens/ConnectNumber';
import Verify from './screens/Verify';
import Crops from './screens/Crops';
import Network from './screens/Network';
import Topics from './screens/Topics';
import Frequency from './screens/Frequency';
import Home from './screens/Home';
import Producer from './screens/Producer';

export default function FarmerApp({ user, onLogout }) {
  const [stack, setStack] = useState([1]);
  const [phone, setPhone] = useState('');
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [connectedFarmers, setConnectedFarmers] = useState([]);
  const [topics, setTopics] = useState({ weather: true, stock: true, orders: true, quality: false });
  const [frequency, setFrequency] = useState({ option: 'daily', timeOfDay: 'morning' });
  const [pauseAll, setPauseAll] = useState(false);
  const [homeTab, setHomeTab] = useState('home');
  const [selectedProducer, setSelectedProducer] = useState(null);
  const [producerSettings, setProducerSettings] = useState({});

  const screen = stack[stack.length - 1];
  const postSetup = stack.includes(7);

  const navigate = (to, opts = {}) => {
    if (opts?.producer) setSelectedProducer(opts.producer);
    setStack(prev => [...prev, to]);
  };

  const goBack = () => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const ctx = {
    user, onLogout,
    phone, setPhone,
    selectedCrops, setSelectedCrops,
    connectedFarmers, setConnectedFarmers,
    topics, setTopics,
    frequency, setFrequency,
    pauseAll, setPauseAll,
    homeTab, setHomeTab,
    selectedProducer, setSelectedProducer,
    producerSettings, setProducerSettings,
    navigate, goBack, postSetup,
  };

  // Network tab inside Home — not a real stack push, just a tab switch
  if (screen === 7 && homeTab === 'network') {
    return (
      <Network
        {...ctx}
        postSetup
        goBack={() => setHomeTab('home')}
        onProducer={(farmer) => {
          setSelectedProducer(farmer);
          navigate(8);
        }}
      />
    );
  }

  switch (screen) {
    case 1: return <ConnectNumber {...ctx} />;
    case 2: return <Verify {...ctx} />;
    case 3: return <Crops {...ctx} />;
    case 4: return <Network {...ctx} />;
    case 5: return <Topics {...ctx} />;
    case 6: return <Frequency {...ctx} />;
    case 7: return <Home {...ctx} />;
    case 8: return <Producer {...ctx} />;
    default: return <ConnectNumber {...ctx} />;
  }
}
