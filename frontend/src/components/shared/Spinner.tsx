import React from 'react';

interface SpinnerProps {
  size?: number;
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size, text }) => (
  <div style={{ textAlign: 'center', padding: text ? 40 : 0 }}>
    <div className="spinner" style={size ? { width: size, height: size } : undefined} />
    {text && <p className="text-muted" style={{ marginTop: 12 }}>{text}</p>}
  </div>
);

export default Spinner;
