import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initializeGA = () => {
  if (GA_MEASUREMENT_ID && import.meta.env.PROD) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log("GA4 initialized successfully.");
  }
};

export const trackPageView = (path: string) => {
  if (GA_MEASUREMENT_ID && import.meta.env.PROD) {
    ReactGA.send({ hitType: "pageview", page: path });
  }
};

export const trackEvent = (name: string, params?: { [key: string]: any }) => {
  if (GA_MEASUREMENT_ID && import.meta.env.PROD) {
    ReactGA.event(name, params);
  }
};
