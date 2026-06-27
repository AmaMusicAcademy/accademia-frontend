import React from 'react';
import BottomNavAllievo from './BottomNavAllievo';

const AllievoLayout = ({ children }) => (
  <div className="pb-20 px-4 max-w-xl mx-auto">
    {children}
    <BottomNavAllievo />
  </div>
);

export default AllievoLayout;
