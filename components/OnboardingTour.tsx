import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export interface TourStep {
  selector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    type: 'click' | 'type';
    selector: string;
  };
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const action = step?.action;

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  }, [currentStep, steps.length, onClose]);
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Core logic for finding and tracking the target element.
  // It intelligently waits for elements that appear asynchronously and tracks their position efficiently.
  useLayoutEffect(() => {
    if (!isOpen || !step?.selector) {
      setTargetRect(null);
      return;
    }

    let pollTimeoutId: ReturnType<typeof setTimeout>;
    let observer: ResizeObserver;
    let scrollHandler = () => {};
    let isCleanedUp = false;

    const cleanup = () => {
        if(isCleanedUp) return;
        isCleanedUp = true;
        clearTimeout(pollTimeoutId);
        if (observer) observer.disconnect();
        window.removeEventListener('scroll', scrollHandler, true);
    };

    const pollForElement = (selector: string, timeout = 8000) => {
        const startTime = Date.now();
        
        const findAndTrack = () => {
            if(isCleanedUp) return;
            const element = document.querySelector(selector);
            
            if (element) {
                const updatePosition = () => {
                    if (isCleanedUp || !element) return;
                    setTargetRect(element.getBoundingClientRect());
                };
                
                scrollHandler = updatePosition;

                updatePosition();
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                
                observer = new ResizeObserver(updatePosition);
                observer.observe(document.body);
                window.addEventListener('scroll', scrollHandler, true);
            } else if (Date.now() - startTime < timeout) {
                pollTimeoutId = setTimeout(findAndTrack, 100);
            } else {
                console.warn(`Tour element "${selector}" not found. Skipping.`);
                handleNext();
            }
        };

        findAndTrack();
    };

    try {
        pollForElement(step.selector);
    } catch (e) {
        console.error(`Tour selector error: ${e}`);
        handleNext();
    }

    return cleanup;
  }, [currentStep, isOpen, step?.selector, handleNext]);

  // Effect for handling interactive steps (click/type)
  useEffect(() => {
    if (!isOpen || !action) return;

    let targetElement: HTMLElement | null = null;
    try {
      targetElement = document.querySelector<HTMLElement>(action.selector);
    } catch(e) {
      console.error(e);
      return;
    }

    if (!targetElement) {
        console.warn(`Tour action target "${action.selector}" not found.`);
        return;
    }
    
    let actionTriggered = false;
    const actionCompleted = () => {
        if (actionTriggered) return;
        actionTriggered = true;
        setTimeout(() => handleNext(), 300);
    };
    
    const listener = (e: Event) => {
      if (action.type === 'click' && targetElement && targetElement.contains(e.target as Node)) {
        actionCompleted();
      } else if (action.type === 'type' && (e.target as HTMLInputElement).value) {
        actionCompleted();
      }
    };
    
    const eventType = action.type === 'click' ? 'click' : 'input';
    const useCapture = action.type === 'click';

    document.addEventListener(eventType, listener, useCapture);

    return () => {
        document.removeEventListener(eventType, listener, useCapture);
    };
  }, [isOpen, action, handleNext]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'ArrowRight' && !action) {
        handleNext();
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, action, handleNext, handlePrev, onClose]);

  if (!isOpen || !step || !targetRect) {
    return null;
  }
  
  const popoverStyle: React.CSSProperties = {};
  const position = step.position || 'bottom';
  const margin = 15;

  switch (position) {
    case 'top':
      popoverStyle.top = `${targetRect.top - margin}px`;
      popoverStyle.left = `${targetRect.left + targetRect.width / 2}px`;
      popoverStyle.transform = 'translate(-50%, -100%)';
      break;
    case 'left':
      popoverStyle.top = `${targetRect.top + targetRect.height / 2}px`;
      popoverStyle.left = `${targetRect.left - margin}px`;
      popoverStyle.transform = 'translate(-100%, -50%)';
      break;
    case 'right':
      popoverStyle.top = `${targetRect.top + targetRect.height / 2}px`;
      popoverStyle.left = `${targetRect.right + margin}px`;
      popoverStyle.transform = 'translateY(-50%)';
      break;
    default: // bottom
      popoverStyle.top = `${targetRect.bottom + margin}px`;
      popoverStyle.left = `${targetRect.left + targetRect.width / 2}px`;
      popoverStyle.transform = 'translateX(-50%)';
      break;
  }


  return (
    <>
      <div 
        className="tour-highlight-box"
        style={{
          width: `${targetRect.width + 10}px`,
          height: `${targetRect.height + 10}px`,
          top: `${targetRect.top - 5}px`,
          left: `${targetRect.left - 5}px`,
        }}
      />
      <div 
        className="tour-popover"
        style={popoverStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-sky-300">{step.title}</h3>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white">
              <X size={20} />
            </button>
        </div>
        <p className="text-sm text-gray-300">{step.content}</p>
        
        {action && (
            <div className="tour-action-prompt">
                {action.type === 'click' ? 'روی عنصر مشخص شده کلیک کنید' : 'در کادر مشخص شده تایپ کنید'}
            </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-gray-500">{currentStep + 1} / {steps.length}</span>
            <div className="flex gap-2">
                {currentStep > 0 && (
                    <button onClick={handlePrev} className="tour-button-secondary">قبلی</button>
                )}
                <button 
                  onClick={handleNext} 
                  className="tour-button-primary"
                  disabled={!!action}
                >
                    {currentStep === steps.length - 1 ? 'پایان' : 'بعدی'}
                </button>
            </div>
        </div>
      </div>
    </>
  );
};