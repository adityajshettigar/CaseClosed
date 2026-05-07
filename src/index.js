import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';

// Import the fonts specified in the theme
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/merriweather/700.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* PASS THE THEME TO THE APP */}
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);

