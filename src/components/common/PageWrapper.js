import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import PageTransition from './PageTransition';
import { usePageTitle } from '../../hooks/usePageTitle';

const PageWrapper = ({ children }) => {
  const location = useLocation();
  usePageTitle(); // Set page title based on route

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
};

export default PageWrapper;
