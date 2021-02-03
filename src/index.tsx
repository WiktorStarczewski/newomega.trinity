import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

Sentry.init({
  dsn: "https://adf39eeb31a04f4c9e2ae1613a647396@o509705.ingest.sentry.io/5604612",
  debug: true,
  autoSessionTracking: true,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

ReactDOM.render(<App />, document.getElementById('root'));
