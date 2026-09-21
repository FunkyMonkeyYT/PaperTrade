import React, { useState, useRef } from 'react';
import { User, Upload, Link2, X, Check, Image as ImageIcon, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProfileSettingsModal({ isOpen, onClose }) {
  const { username, email, avatarUrl, updateAvatar } = useAuth();
  const { success, error: toastError } = useToast();

  const [customUrl, setCustomUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState(avatarUrl || '');
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'url'
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle local file upload (converts to base64 Data URL)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastError('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalUrl = activeMode === 'url' ? customUrl.trim() : previewUrl;

    if (!finalUrl) {
      toastError('Please upload an image or enter a valid image URL.');
      return;
    }

    setIsSaving(true);
    try {
      await updateAvatar(finalUrl);
      success('Custom Profile Picture updated successfully!');
      if (onClose) onClose();
    } catch (err) {
      toastError('Failed to update profile picture.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setPreviewUrl('');
    setCustomUrl('');
    await updateAvatar('');
    success('Profile picture removed.');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="max-w-md w-full p-5 sm:p-6 rounded-lg border border-slate-200 bg-white shadow-xl relative animate-scaleIn my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center text-[#2563EB]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans">
              Custom Profile Picture (PFP)
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Upload any custom image or paste an image URL
            </p>
          </div>
        </div>

        {/* Current Avatar Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
          <div className="relative group">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="PFP Preview"
                className="w-20 h-20 rounded-full object-cover border-2 border-[#2563EB] shadow-sm"
                onError={() => {
                  toastError('Unable to load image from provided URL');
                  setPreviewUrl('');
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-2xl font-bold font-mono shadow-sm">
                {(username || 'T').charAt(0).toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#2563EB] text-white hover:bg-blue-700 shadow-sm transition-transform hover:scale-110 cursor-pointer"
              title="Upload from device"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 text-center">
            <span className="text-xs font-mono font-bold text-slate-900">{username || 'Trader'}</span>
            <div className="text-[11px] text-slate-500 font-mono">{email || 'Verified Account'}</div>
          </div>
        </div>

        {/* Mode Selector (Upload File vs Paste URL) */}
        <div className="grid grid-cols-2 p-0.5 bg-slate-100 border border-slate-200 rounded-md mb-4">
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMode === 'upload'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('url')}
            className={`py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMode === 'url'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Mode Content */}
        {activeMode === 'upload' ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#2563EB] bg-slate-50 hover:bg-slate-100 p-5 rounded-lg text-center cursor-pointer transition-all mb-4"
          >
            <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-800 font-mono">
              Click to choose an image from your computer
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Supports PNG, JPG, GIF, WebP (Max 5MB)
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-[11px] font-mono text-slate-700 font-bold mb-1">
              Paste Direct Image Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                placeholder="https://example.com/my-photo.jpg"
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 placeholder:text-slate-400 font-mono text-xs focus:outline-none focus:border-[#2563EB] transition-all"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
              title="Remove Profile Picture"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !previewUrl}
            className="flex-1 py-2 rounded-md bg-[#2563EB] hover:bg-blue-700 text-white font-mono font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Custom PFP</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
