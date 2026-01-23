import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initializeGA = () => {
  if (GA_MEASUREMENT_ID && process.env.NODE_ENV === 'production') {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log('GA4 initialized successfully.');
  }
};

export const trackPageView = (path: string) => {
  if (GA_MEASUREMENT_ID && process.env.NODE_ENV === 'production') {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const trackEvent = (name: string, params?: Record<string, string | number | boolean | undefined | null>) => {
  if (GA_MEASUREMENT_ID && process.env.NODE_ENV === 'production') {
    ReactGA.event(name, params);
  }
};
