import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useRouteTransition = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath) {
      setIsTransitioning(true);
      setPrevPath(location.pathname);
      
      // Reset transition state after animation completes
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300); // Match this with your transition duration

      return () => clearTimeout(timer);
    }
  }, [location, prevPath]);

  return {
    isTransitioning,
    currentPath: location.pathname,
    previousPath: prevPath
  };
};

export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [pathname]);
};

export const useRouteChange = (callback) => {
  const location = useLocation();

  useEffect(() => {
    callback(location);
  }, [location, callback]);
};
