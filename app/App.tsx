import React from 'react';
import { StatusBar } from 'expo-status-bar';

import IndexScreen from './screens/index';
import './global.css';

export default function App() {
  return (
    <>
      <IndexScreen />
      <StatusBar style="auto" />
    </>
  );
}
