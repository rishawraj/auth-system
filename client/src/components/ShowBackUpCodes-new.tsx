import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Download,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import React, { useState } from "react";

interface BackupCodesModalProps {
  backupCodes: string[];
  onClose?: () => void;
}

const BackupCodesModal = ({
  backupCodes = [],
  onClose,
}: BackupCodesModalProps) => {
  const [showBackupCodes, setShowBackupCodes] = useState(true);
  const [copiedCodes, setCopiedCodes] = useState(new Set());
  const [allCopied, setAllCopied] = useState(false);
  const [codesRevealed, setCodesRevealed] = useState(false);

  const navigate = useNavigate({ from: "/2FA" });

  // Ensure backupCodes is always an array
  const validBackupCodes = Array.isArray(backupCodes) ? backupCodes : [];

  // Don't render if no backup codes are provided
  if (!validBackupCodes.length) {
    return null;
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodes((prev) => new Set([...prev, code]));
      setTimeout(() => {
        setCopiedCodes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(code);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const copyAllCodes = async () => {
    try {
      const allCodesText = validBackupCodes.join("\n");
      await navigator.clipboard.writeText(allCodesText);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy all codes: ", err);
    }
  };

  const downloadCodes = () => {
    const codesText = `Backup Codes for Your Account
Generated: ${new Date().toLocaleDateString()}

IMPORTANT: Store these codes securely and keep them private.
Each code can only be used once for account recovery.

${validBackupCodes.map((code, index) => `${index + 1}. ${code}`).join("\n")}

Instructions:
- Use these codes if you lose access to your primary authentication method
- Each code can only be used once
- Store them in a secure password manager or safe location
- Do not share these codes with anyone
- Generate new codes if you suspect these have been compromised`;

    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {showBackupCodes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center bg-black p-4 backdrop-blur-sm"
          onClick={(e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
              setShowBackupCodes(false);
              onClose?.();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-800"
          >
            {/* Header */}
            <div className="rounded-t-xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">Backup Recovery Codes</h2>
                  <p className="text-sm text-blue-100">
                    Keep these codes safe and secure
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Warning Alert */}
              <div className="mb-6 rounded-r-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:bg-amber-900/20">
                <div className="flex items-start">
                  <AlertTriangle className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-amber-400" />
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Important Security Notice
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      These codes are your backup access to your account. Store
                      them securely and never share them with anyone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                  How to use backup codes:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="mt-0.5 mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      1
                    </span>
                    Use these codes when you can't access your primary 2FA
                    method
                  </li>
                  <li className="flex items-start">
                    <span className="mt-0.5 mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      2
                    </span>
                    Each code can only be used once - they become invalid after
                    use
                  </li>
                  <li className="flex items-start">
                    <span className="mt-0.5 mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      3
                    </span>
                    Store them in a password manager or secure physical location
                  </li>
                  <li className="flex items-start">
                    <span className="mt-0.5 mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      4
                    </span>
                    Generate new codes if you suspect these have been
                    compromised
                  </li>
                </ul>
              </div>

              {/* Reveal Toggle */}
              <div className="mb-4">
                <button
                  onClick={() => setCodesRevealed(!codesRevealed)}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {codesRevealed ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {codesRevealed ? "Hide" : "Reveal"} Backup Codes
                </button>
              </div>

              {/* Backup Codes Grid */}
              {codesRevealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {validBackupCodes.map((code, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative rounded-lg border-2 border-gray-200 bg-gray-50 p-4 text-left transition-all duration-200 hover:border-blue-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-500"
                        onClick={() => copyToClipboard(code)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                              Code {index + 1}
                            </div>
                            <div className="font-mono text-lg font-semibold tracking-wider text-gray-900 dark:text-white">
                              {code}
                            </div>
                          </div>
                          <div className="opacity-0 transition-opacity group-hover:opacity-100">
                            {copiedCodes.has(code) ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <Copy className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {copiedCodes.has(code) && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-green-400 bg-green-50 dark:bg-green-900/20"
                          >
                            <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-300">
                              <Check className="h-5 w-5" />
                              Copied!
                            </div>
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={copyAllCodes}
                      className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      {allCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          All Codes Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy All Codes
                        </>
                      )}
                    </button>

                    <button
                      onClick={downloadCodes}
                      className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                    >
                      <Download className="h-4 w-4" />
                      Download as File
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Footer Warning */}
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-start">
                  <AlertTriangle className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-red-800 dark:text-red-200">
                      Security Reminder
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      You won't be able to view these codes again after closing
                      this window. Make sure to save them in a secure location
                      before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowBackupCodes(false);
                    //todo handle this in parent component
                    navigate({ to: "/profile" });
                  }}
                  className="rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  I've Saved My Codes
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackupCodesModal;
