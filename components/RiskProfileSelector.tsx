import React from 'react';
import type { RiskProfile } from '../types';
import { riskProfiles } from '../types';
import { Shield, Scale, Rocket } from 'lucide-react';

interface RiskProfileSelectorProps {
  riskProfile: RiskProfile;
  setRiskProfile: (riskProfile: RiskProfile) => void;
  disabled?: boolean;
}

const profileOptions: { name: RiskProfile; icon: React.ElementType }[] = [
    { name: 'محافظه‌کار', icon: Shield },
    { name: 'متعادل', icon: Scale },
    { name: 'تهاجمی', icon: Rocket },
];

export const RiskProfileSelector: React.FC<RiskProfileSelectorProps> = ({ riskProfile, setRiskProfile, disabled = false }) => {
  return (
    <div className={`risk-profile-selector transition-opacity ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <label className="block text-sm font-medium text-gray-300 mb-2">
            پروفایل ریسک
        </label>
        <div className="grid grid-cols-3 gap-2 bg-gray-900/50 border border-gray-600/80 rounded-lg p-1 h-[68px]">
            {profileOptions.map((option) => {
                const isSelected = riskProfile === option.name;
                return (
                    <button
                        key={option.name}
                        type="button"
                        onClick={() => setRiskProfile(option.name)}
                        disabled={disabled}
                        className={`flex flex-col items-center justify-center text-center p-2 rounded-md transition-all duration-300 h-full disabled:cursor-not-allowed ${
                            isSelected
                                ? 'bg-sky-700/60 shadow-lg ring-2 ring-sky-500/80 text-white'
                                : 'bg-gray-800/50 hover:bg-gray-700/70 text-gray-400'
                        }`}
                        aria-pressed={isSelected}
                    >
                        <option.icon className={`w-6 h-6 mb-1 transition-colors ${isSelected ? 'text-sky-300' : 'text-gray-500'}`} />
                        <span className="text-xs sm:text-sm font-semibold">{option.name}</span>
                    </button>
                );
            })}
        </div>
        <p className="mt-2 text-xs text-gray-500">پروفایل شما تحلیل را شخصی‌سازی می‌کند.</p>
    </div>
  );
};