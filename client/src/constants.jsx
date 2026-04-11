import React from 'react';
import { Wheat, Bean, Coffee, Banana, Nut, TreeDeciduous, LeafyGreen, Sprout, Leaf } from './components/Icons';

// Shared constants used across components (Fix #4)
export const commodities = [
  { key: "maize", label: "Maize", icon: <Wheat size={16} className="text-green-700" /> },
  { key: "beans", label: "Beans", icon: <Bean size={16} className="text-green-700" /> },
  { key: "coffee", label: "Coffee", icon: <Coffee size={16} className="text-green-700" /> },
  { key: "matooke", label: "Matooke", icon: <Banana size={16} className="text-green-700" /> },
  { key: "rice", label: "Rice", icon: <Wheat size={16} className="text-green-700" /> },
  { key: "groundnuts", label: "Groundnuts", icon: <Nut size={16} className="text-green-700" /> },
  { key: "cassava", label: "Cassava", icon: <TreeDeciduous size={16} className="text-green-700" /> },
  { key: "sweet_potatoes", label: "Sweet Potato", icon: <LeafyGreen size={16} className="text-green-700" /> },
  { key: "sorghum", label: "Sorghum", icon: <Sprout size={16} className="text-green-700" /> },
  { key: "millet", label: "Millet", icon: <Leaf size={16} className="text-green-700" /> },
];

export const regions = ["All", "Central", "Eastern", "Northern", "Western"];
