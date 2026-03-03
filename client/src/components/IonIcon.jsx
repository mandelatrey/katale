import React from 'react';

export default function IonIcon({ name, size, color, className, style, onClick }) {
  return (
    <ion-icon 
      name={name} 
      class={className} 
      onClick={onClick}
      style={{
        fontSize: size ? (typeof size === 'number' ? `${size}px` : size) : 'inherit',
        color: color || 'inherit',
        ...style
      }}
    ></ion-icon>
  );
}
