
import React from 'react';
import type { UploadedFile } from '../types';
import { FileText } from 'lucide-react';

interface FileListProps {
    files: UploadedFile[];
}

export const FileList: React.FC<FileListProps> = ({ files }) => {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <ul className="space-y-3">
      {files.map((file, index) => (
        <li key={index} className="flex items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
          {file.category === 'تصویر چارت' ? (
             <img src={file.content} alt={file.name} className="h-10 w-10 object-cover rounded-md mr-4 flex-shrink-0" />
          ) : (
             <FileText className="h-8 w-8 text-sky-400 my-auto mr-4 flex-shrink-0" />
          )}
          <div className="flex-grow">
            <p className="text-sm font-medium text-gray-200">{file.name}</p>
            <p className="text-xs text-gray-400">{file.type}</p>
          </div>
          <div className="text-sm text-gray-400 font-mono">
            {formatBytes(file.size)}
          </div>
        </li>
      ))}
    </ul>
  );
};