import React, { isValidElement } from 'react';
import { ContextualTooltip } from './ContextualTooltip';

interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  description: string;
  valueClassName?: string;
  tooltipText?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, description, valueClassName = 'text-gray-100', tooltipText }) => {
  const isStringValue = typeof value === 'string' || typeof value === 'number';

  const renderClonedIcon = (extraClass: string) => {
    if (!isValidElement(icon)) {
      return icon;
    }
    // Clones the element and merges classNames.
    const iconElement = icon as React.ReactElement<{ className?: string }>;
    return React.cloneElement(iconElement, {
      className: [extraClass, iconElement.props.className].filter(Boolean).join(' '),
    });
  };

  return (
    <div className="group relative bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 shadow-lg flex flex-col justify-between h-full transition-all duration-300 hover:bg-gray-800/70 hover:border-gray-700/80 backdrop-blur-sm">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
          {renderClonedIcon('w-16 h-16')}
      </div>
      <div className="relative">
        <div className="flex justify-between items-start">
          <div className="text-md font-medium text-gray-400">
             {tooltipText ? <ContextualTooltip text={tooltipText}>{title}</ContextualTooltip> : title}
          </div>
          {renderClonedIcon('w-7 h-7')}
        </div>
        <div className={`mt-2 font-bold ${isStringValue ? 'text-2xl md:text-3xl' : ''} ${valueClassName}`}>
          {value}
        </div>
      </div>
      <p className="relative mt-4 text-xs text-gray-500">{description}</p>
    </div>
  );
};