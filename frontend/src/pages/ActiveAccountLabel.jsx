import React from 'react';
import AccountSelector from '../components/AccountSelector';

export default function ActiveAccountLabel() {
  return (
    <div style={{
      position: 'absolute',
      top: 12,
      right: 12,
      fontSize: 14,
      zIndex: 1000,
      userSelect: 'none',
    }}>
      <AccountSelector style={{ color: '#bbb', fontWeight: '500' }} />
    </div>
  );
}
