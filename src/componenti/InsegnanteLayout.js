import React from 'react';
import BottomNav from './BottomNav';

const InsegnanteLayout = ({ children }) => {
  return (
    <div className="pb-20 px-4">
      {children}
      <BottomNav />
    </div>
  );
};

export default InsegnanteLayout;
