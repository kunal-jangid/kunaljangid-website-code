import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ToastProvider, toastManager } from "@/components/ui/toast";
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileImage,
  KeyRound,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string | null;
  status: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
  progress?: number;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/avif",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

function PhotoUploaderInner() {
  const [authToken, setAuthToken] = useState("");
  const [rememberAuth, setRememberAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isReceiverOnline, setIsReceiverOnline] = useState<boolean | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stagedFilesRef = useRef<StagedFile[]>(stagedFiles);
  stagedFilesRef.current = stagedFiles;

  // Revoke object URLs on component unmount
  useEffect(() => {
    return () => {
      stagedFilesRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  // Load saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("portfolio_upload_auth_token");
    if (savedToken) {
      setAuthToken(savedToken);
      setRememberAuth(true);
    }
    checkReceiverStatus();
  }, []);

  // Save/Remove token when preference changes
  const handleAuthChange = (value: string) => {
    setAuthToken(value);
    if (rememberAuth && value) {
      localStorage.setItem("portfolio_upload_auth_token", value);
    } else if (!value) {
      localStorage.removeItem("portfolio_upload_auth_token");
    }
  };

  const handleRememberToggle = (checked: boolean) => {
    setRememberAuth(checked);
    if (checked && authToken) {
      localStorage.setItem("portfolio_upload_auth_token", authToken);
    } else {
      localStorage.removeItem("portfolio_upload_auth_token");
    }
  };

  const checkReceiverStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setIsReceiverOnline(Boolean(data.online));
      } else {
        setIsReceiverOnline(false);
      }
    } catch {
      setIsReceiverOnline(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const addFiles = (files: FileList | File[]) => {
    const newItems: StagedFile[] = [];

    Array.from(files).forEach((file) => {
      // Validate MIME
      const isAllowed = ALLOWED_MIME_TYPES.some((type) =>
        file.type.toLowerCase().includes(type) ||
        file.name.toLowerCase().endsWith(".heic")
      );

      if (!isAllowed) {
        toastManager.add({
          title: "Unsupported File",
          description: `${file.name} is not a supported format (JPEG, PNG, WEBP, HEIC, AVIF).`,
          type: "error",
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toastManager.add({
          title: "File Too Large",
          description: `${file.name} exceeds the 25MB limit.`,
          type: "error",
        });
        return;
      }

      const isWebRenderable = !file.name.toLowerCase().endsWith(".heic");
      const previewUrl = isWebRenderable ? URL.createObjectURL(file) : null;

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        status: "idle",
      });
    });

    setStagedFiles((prev) => [...prev, ...newItems]);
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearCompleted = () => {
    setStagedFiles((prev) => {
      prev.filter((i) => i.status === "success").forEach((i) => {
        if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      });
      return prev.filter((i) => i.status !== "success");
    });
  };

  // Batch upload with concurrency = 2
  const startUploadBatch = async () => {
    if (!authToken.trim()) {
      toastManager.add({
        title: "Auth Token Required",
        description: "Please enter your secret passphrase before uploading.",
        type: "error",
      });
      return;
    }

    const pending = stagedFiles.filter((f) => f.status === "idle" || f.status === "error");
    if (pending.length === 0) return;

    setIsUploadingBatch(true);

    const CONCURRENCY = 2;
    let index = 0;

    const uploadSingleFile = async (item: StagedFile) => {
      setStagedFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" } : f))
      );

      try {
        const mime = item.file.type || (item.file.name.toLowerCase().endsWith(".heic") ? "image/heic" : "image/jpeg");
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken.trim()}`,
            "Content-Type": mime,
            "X-Original-Filename": encodeURIComponent(item.file.name),
          },
          body: item.file,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          throw new Error(data.error || `Upload failed with HTTP ${res.status}`);
        }

        setStagedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "success" } : f))
        );
      } catch (err: any) {
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "error", errorMessage: err.message || "Failed" }
              : f
          )
        );
      }
    };

    const worker = async () => {
      while (index < pending.length) {
        const currentItem = pending[index++];
        await uploadSingleFile(currentItem);
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () => worker());
    await Promise.all(workers);

    setIsUploadingBatch(false);
    toastManager.add({
      title: "Batch Finished",
      description: "Batch processing completed.",
      type: "info",
    });
  };

  const completedCount = stagedFiles.filter((f) => f.status === "success").length;
  const progressPercent = stagedFiles.length > 0 ? Math.round((completedCount / stagedFiles.length) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 font-mono">
      {/* 00 // Telemetry & Health Header */}
      <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-border/40">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isReceiverOnline === true
                ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"
                : isReceiverOnline === false
                ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                : "bg-amber-500"
            }`}
          />
          <div className="text-xs">
            <span className="opacity-60">RECEIVER STATUS: </span>
            <span className="font-bold">
              {isReceiverOnline === true
                ? "[ DESKTOP ONLINE ]"
                : isReceiverOnline === false
                ? "[ DESKTOP OFFLINE ]"
                : "[ CHECKING... ]"}
            </span>
          </div>
        </div>
        <Button
          onClick={checkReceiverStatus}
          disabled={isCheckingStatus}
          variant="outline"
          size="sm"
          className="text-xs uppercase gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? "animate-spin" : ""}`} />
          <span>Probe Desktop</span>
        </Button>
      </div>

      {/* 01 // Authentication Gate */}
      <div className="glass-panel p-6 md:p-8 rounded-2xl border border-brand-border/40 space-y-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-accent font-bold">
          <KeyRound className="w-4 h-4" />
          <span>01 // Secret Passphrase Authorization</span>
        </div>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={authToken}
            onChange={(e) => handleAuthChange(e.target.value)}
            placeholder="Enter your private UPLOAD_SECRET token..."
            className="pr-10 bg-transparent border-brand-border/40 focus-visible:border-brand-accent transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs opacity-70 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberAuth}
            onChange={(e) => handleRememberToggle(e.target.checked)}
            className="rounded border-brand-border/40 text-brand-accent focus:ring-0"
          />
          <span>Remember secret key on this device</span>
        </label>
      </div>

      {/* 02 // Drag-and-Drop Staging Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-panel p-10 md:p-14 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
          isDragging
            ? "border-brand-accent bg-brand-accent/10 bklit-glow scale-[1.01]"
            : "border-brand-border/40 hover:border-brand-accent/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm md:text-base font-bold">
            DROP PHOTOS HERE OR <span className="text-brand-accent underline underline-offset-4">BROWSE</span>
          </p>
          <p className="text-xs opacity-60 mt-1">
            JPEG, PNG, WEBP, HEIC, AVIF • Up to 25MB each • Direct to Desktop
          </p>
        </div>
      </div>

      {/* 03 // Staged File List & Upload Queue */}
      {stagedFiles.length > 0 && (
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-brand-border/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/30 pb-4">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-brand-accent font-bold">
                03 // Staging Queue ({completedCount} / {stagedFiles.length} Completed)
              </h2>
              <div className="w-full bg-brand-border/20 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-brand-accent h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {completedCount > 0 && (
                <Button
                  onClick={clearCompleted}
                  variant="outline"
                  size="sm"
                  className="text-xs uppercase"
                  disabled={isUploadingBatch}
                >
                  Clear Finished
                </Button>
              )}
              <Button
                onClick={startUploadBatch}
                disabled={isUploadingBatch || stagedFiles.every((f) => f.status === "success")}
                className="text-xs uppercase tracking-wider"
              >
                {isUploadingBatch ? (
                  <>
                    <Spinner className="w-3.5 h-3.5 mr-1.5" />
                    Transmitting...
                  </>
                ) : (
                  "Transmit Payloads"
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-1">
            {stagedFiles.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-brand-border/30 bg-brand-bg/40 flex items-center gap-3 relative group"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-brand-border/20 flex-shrink-0 flex items-center justify-center">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileImage className="w-6 h-6 opacity-60 text-brand-accent" />
                  )}
                </div>

                <div className="min-w-0 flex-grow text-xs">
                  <p className="truncate font-semibold">{item.file.name}</p>
                  <p className="opacity-50 text-[10px]">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>

                  <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                    {item.status === "idle" && <span className="opacity-60">[ QUEUED ]</span>}
                    {item.status === "uploading" && (
                      <span className="text-brand-accent flex items-center gap-1">
                        <Spinner className="w-2.5 h-2.5" /> SENDING...
                      </span>
                    )}
                    {item.status === "success" && (
                      <span className="text-emerald-500 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> SAVED
                      </span>
                    )}
                    {item.status === "error" && (
                      <span
                        className="text-rose-500 flex items-center gap-1 font-bold truncate"
                        title={item.errorMessage}
                      >
                        <XCircle className="w-3 h-3" /> ERROR
                      </span>
                    )}
                  </div>
                </div>

                {item.status !== "uploading" && (
                  <button
                    onClick={() => removeStagedFile(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PhotoUploader() {
  return (
    <ToastProvider>
      <PhotoUploaderInner />
    </ToastProvider>
  );
}
