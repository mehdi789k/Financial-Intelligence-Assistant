import React, { useState, useEffect, useRef } from 'react';

interface ProgressiveRevealProps {
  children: React.ReactNode;
  delay: number;
  className?: string;
}

export const ProgressiveReveal: React.FC<ProgressiveRevealProps> = ({ children, delay, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if the component is still mounted
      if (ref.current) {
        setIsVisible(true);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [delay]);

  return (
    <div ref={ref} className={`reveal-container ${isVisible ? 'revealed' : ''} ${className}`}>
      {children}
    </div>
  );
};