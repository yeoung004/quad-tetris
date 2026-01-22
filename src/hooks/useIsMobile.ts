import useWindowSize from './useWindowSize';

export const useIsMobile = () => {
  const { width } = useWindowSize();
  // Using 768px as a common breakpoint for mobile devices
  const isMobile = width < 768;
  return isMobile;
};
