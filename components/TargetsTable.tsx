
import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, Target } from 'lucide-react';

interface TargetsTableProps {
  title: string;
  targets: number[];
  type: 'buy' | 'sell';
}

export const TargetsTable: React.FC<TargetsTableProps> = ({ title, targets, type }) => {
  const isBuy = type === 'buy';
  const headerColor = isBuy ? 'bg-green-800/20' : 'bg-red-800/20';
  const icon = isBuy ? 
    <ArrowDownCircle className="w-6 h-6 ml-2 text-green-400" /> : 
    <ArrowUpCircle className="w-6 h-6 ml-2 text-red-400" />;

  return (
    <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm">
      <h3 className="text-xl font-semibold mb-4 flex items-center">{icon}{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className={headerColor}>
            <tr>
              <th className="p-3 text-sm font-semibold tracking-wide text-gray-300 rounded-r-lg">هدف</th>
              <th className="p-3 text-sm font-semibold tracking-wide text-gray-300 rounded-l-lg">قیمت</th>
            </tr>
          </thead>
          <tbody>
            {targets && targets.length > 0 ? (
                targets.map((target, index) => (
                  <tr key={index} className="border-b border-gray-700/50 last:border-none">
                    <td className="p-3 text-sm text-gray-400">
                      <span className="flex items-center">
                        <Target className="w-4 h-4 ml-2 text-gray-500" />
                        هدف {index + 1}
                      </span>
                    </td>
                    <td className={`p-3 text-base font-mono font-bold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                      ${target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                  </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={2} className="p-4 text-center text-gray-500 text-sm">
                        هیچ هدفی مشخص نشده است.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
