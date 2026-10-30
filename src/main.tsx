import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { createStreamStore } from './store/store.ts';
import { StreamContext } from './store/useStream.ts';
import { connectStream } from './stream/connect.ts';
import './styles.css';

const store = createStreamStore();
connectStream(store);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StreamContext.Provider value={store}>
      <App />
    </StreamContext.Provider>
  </StrictMode>,
);
