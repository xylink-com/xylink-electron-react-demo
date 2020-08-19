import React from 'react';
import { render } from 'react-dom';
import './style/global.index.css';
import App from './renderer/index';

document.addEventListener('DOMContentLoaded', () => {
  render(<App />, document.getElementById('root'));
});
