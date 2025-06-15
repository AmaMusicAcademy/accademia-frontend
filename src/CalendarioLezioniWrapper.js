// CalendarioLezioniWrapper.js
import React from 'react';
import { useParams } from 'react-router-dom';
import CalendarioLezioni from './CalendarioLezioni';

const CalendarioLezioniWrapper = () => {
  const { idInsegnante } = useParams();
  return <CalendarioLezioni idInsegnante={idInsegnante} />;
};

export default CalendarioLezioniWrapper;
