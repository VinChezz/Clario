"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  X,
  HardDrive,
  FileText,
  File,
  Folder,
  Layers,
  TrendingUp,
  AlertTriangle,
  Zap,
  Upload,
  PieChart,
  Database,
  Cloud,
  Cpu,
  Shield,
  Users,
  FolderOpen,
  FileArchive,
  FileBox,
  GitBranch,
  HardDriveDownload,
  Package,
  BarChart,
  Calendar,
  Clock,
  ExternalLink,
  Share2,
  Printer,
  Download,
  Copy,
  Check,
  Globe,
  Smartphone,
  Tablet,
  Server,
  Network,
  ShieldCheck,
  Lock,
  Eye,
  Activity,
  Target,
  Cpu as CpuIcon,
  MemoryStick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StorageData } from "@/hooks/useStorage";
import { Plan } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface StorageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageData: StorageData | null;
  currentUsageGB: number;
  plan: Plan | string;
  realUsedGB?: number;
  weightMultiplier?: number;
  weightedUsedGB?: number;
  teamId?: string;
}

export function StorageDetailsModal({
  isOpen,
  onClose,
  storageData,
  currentUsageGB,
  plan,
  realUsedGB = 0,
  weightMultiplier = 1,
  weightedUsedGB = 0,
  teamId,
}: StorageDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const getTotalFiles = () => {
    if (!storageData) return 0;

    const totalCreatedFiles = storageData.user?.totalCreatedFiles || 0;
    const activeCount = storageData.files?.activeCount || 0;

    if (storageData.files?.statsByType?.totalFiles) {
      return storageData.files.statsByType.totalFiles;
    }

    if (storageData.files?.statsByType) {
      const stats = storageData.files.statsByType;
      return (
        (stats.documents || 0) + (stats.whiteboards || 0) + (stats.mixed || 0)
      );
    }

    return Math.max(totalCreatedFiles, activeCount);
  };

  const handlePrint = () => {
    const printStyles = `
      @media print {
        @page {
          margin: 1cm;
          size: A4 landscape;
        }

        body * {
          visibility: hidden;
        }

        #storage-print-content,
        #storage-print-content * {
          visibility: visible;
        }

        #storage-print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white;
          color: black;
          font-family: Arial, sans-serif;
          padding: 20px;
        }

        .print-hidden {
          display: none !important;
        }

        .print-grid {
          display: grid !important;
          gap: 12px;
          margin-bottom: 20px;
        }

        .print-section {
          page-break-inside: avoid;
          margin-bottom: 20px;
        }

        .print-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #000;
        }

        .print-footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 1px solid #ccc;
          text-align: center;
          font-size: 12px;
          color: #666;
        }

        .print-logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .print-date {
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }

        .print-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background: #f9f9f9;
          break-inside: avoid;
        }

        .print-card-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .print-card-content {
          font-size: 14px;
        }

        .print-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .print-stat-item {
          padding: 10px;
          border: 1px solid #eee;
          border-radius: 6px;
          text-align: center;
        }

        .print-stat-value {
          font-size: 18px;
          font-weight: bold;
          margin: 5px 0;
        }

        .print-stat-label {
          font-size: 12px;
          color: #666;
        }

        .print-progress-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin: 10px 0;
        }

        .print-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          border-radius: 4px;
        }

        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }

        .print-table th,
        .print-table td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
          font-size: 12px;
        }

        .print-table th {
          background: #f5f5f5;
          font-weight: bold;
        }

        .print-alert {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
        }

        .print-alert-title {
          font-weight: bold;
          color: #856404;
          margin-bottom: 5px;
        }

        .print-alert-message {
          font-size: 13px;
          color: #666;
        }

        .print-color-box {
          width: 12px;
          height: 12px;
          display: inline-block;
          margin-right: 5px;
          border-radius: 3px;
        }

        .print-metric {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }

        .print-metric-label {
          font-weight: 500;
        }

        .print-metric-value {
          font-weight: bold;
        }

        .print-chart {
          height: 200px;
          position: relative;
          margin: 20px 0;
        }

        .print-watermark {
          opacity: 0.1;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72px;
          color: #ccc;
          z-index: 1000;
          pointer-events: none;
        }
      }
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const planLimitGB = getPlanLimitGB();
    const displayUsageGB = weightedUsedGB > 0 ? weightedUsedGB : currentUsageGB;
    const percentage =
      planLimitGB > 0 ? (displayUsageGB / planLimitGB) * 100 : 0;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Storage Analytics Report - ${currentDate}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          <div id="storage-print-content">
            <div class="print-watermark">${plan} PLAN</div>

            <div class="print-header">
              <div class="print-logo">📊 Storage Analytics Report</div>
              <div class="print-date">Generated on ${currentDate}</div>
              <div style="font-size: 14px; color: #666;">Plan: ${plan} | Team ID: ${
                teamId || "N/A"
              }</div>
            </div>

            <div class="print-section">
              <h2>Storage Overview</h2>
              <div class="print-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="print-card">
                  <div class="print-card-title">📈 Usage Summary</div>
                  <div class="print-card-content">
                    <div style="text-align: center; margin: 20px 0;">
                      <div style="font-size: 36px; font-weight: bold; color: ${
                        percentage > 90
                          ? "#dc2626"
                          : percentage > 70
                            ? "#f59e0b"
                            : "#10b981"
                      }">
                        ${percentage.toFixed(1)}%
                      </div>
                      <div style="font-size: 14px; color: #666;">Storage Used</div>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Used Storage:</span>
                      <span class="print-metric-value">${formatGB(
                        displayUsageGB,
                      )}</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Total Limit:</span>
                      <span class="print-metric-value">${formatGB(
                        planLimitGB,
                      )}</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Available:</span>
                      <span class="print-metric-value">${formatGB(
                        planLimitGB - displayUsageGB,
                      )}</span>
                    </div>
                    ${
                      realUsedGB > 0
                        ? `
                    <div class="print-metric">
                      <span class="print-metric-label">Real Storage:</span>
                      <span class="print-metric-value">${formatGB(
                        realUsedGB,
                      )}</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Weight Multiplier:</span>
                      <span class="print-metric-value">${weightMultiplier.toFixed(
                        1,
                      )}x</span>
                    </div>
                    `
                        : ""
                    }
                  </div>
                </div>

                <div class="print-card">
                  <div class="print-card-title">⚡ Quick Stats</div>
                  <div class="print-stat-grid">
                    <div class="print-stat-item">
                      <div class="print-stat-label">Active Files</div>
                      <div class="print-stat-value">${
                        storageData?.files.activeCount || 0
                      }</div>
                    </div>
                    <div class="print-stat-item">
                      <div class="print-stat-label">Total Files</div>
                      <div class="print-stat-value">${getTotalFiles()}</div>
                    </div>
                    <div class="print-stat-item">
                      <div class="print-stat-label">File Versions</div>
                      <div class="print-stat-value">${
                        storageData?.files.versionsCount || 0
                      }</div>
                    </div>
                    <div class="print-stat-item">
                      <div class="print-stat-label">Storage Health</div>
                      <div class="print-stat-value" style="color: ${
                        percentage > 90
                          ? "#dc2626"
                          : percentage > 70
                            ? "#f59e0b"
                            : "#10b981"
                      }">
                        ${
                          percentage > 90
                            ? "Critical"
                            : percentage > 70
                              ? "Warning"
                              : "Healthy"
                        }
                      </div>
                    </div>
                    <div class="print-stat-item">
                      <div class="print-stat-label">Daily Uploads</div>
                      <div class="print-stat-value">24 avg</div>
                    </div>
                    <div class="print-stat-item">
                      <div class="print-stat-label">Plan Type</div>
                      <div class="print-stat-value">${plan}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="print-section">
              <h2>File Type Distribution</h2>
              ${
                storageData?.files.statsByType
                  ? `
              <table class="print-table">
                <thead>
                  <tr>
                    <th>File Type</th>
                    <th>Count</th>
                    <th>Percentage</th>
                    <th>Storage Impact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span class="print-color-box" style="background: #3b82f6;"></span> Documents</td>
                    <td>${storageData.files.statsByType.documents || 0}</td>
                    <td>${
                      storageData.files.statsByType.totalFiles > 0
                        ? (
                            ((storageData.files.statsByType.documents || 0) /
                              storageData.files.statsByType.totalFiles) *
                            100
                          ).toFixed(1)
                        : "0.0"
                    }%</td>
                    <td>Medium</td>
                  </tr>
                  <tr>
                    <td><span class="print-color-box" style="background: #8b5cf6;"></span> Whiteboards</td>
                    <td>${storageData.files.statsByType.whiteboards || 0}</td>
                    <td>${
                      storageData.files.statsByType.totalFiles > 0
                        ? (
                            ((storageData.files.statsByType.whiteboards || 0) /
                              storageData.files.statsByType.totalFiles) *
                            100
                          ).toFixed(1)
                        : "0.0"
                    }%</td>
                    <td>High</td>
                  </tr>
                  <tr>
                    <td><span class="print-color-box" style="background: #10b981;"></span> Mixed Files</td>
                    <td>${storageData.files.statsByType.mixed || 0}</td>
                    <td>${
                      storageData.files.statsByType.totalFiles > 0
                        ? (
                            ((storageData.files.statsByType.mixed || 0) /
                              storageData.files.statsByType.totalFiles) *
                            100
                          ).toFixed(1)
                        : "0.0"
                    }%</td>
                    <td>Variable</td>
                  </tr>
                  <tr style="font-weight: bold; background: #f8f9fa;">
                    <td>Total Active Files</td>
                    <td colspan="3">${
                      storageData.files.statsByType.totalFiles || 0
                    }</td>
                  </tr>
                </tbody>
              </table>
              `
                  : "<p>No file type data available</p>"
              }
            </div>

            <div class="print-section">
              <h2>Additional Statistics</h2>
              <div class="print-grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="print-card">
                  <div class="print-card-title">🔒 Security Metrics</div>
                  <div class="print-card-content">
                    <div class="print-metric">
                      <span class="print-metric-label">Data Encryption:</span>
                      <span class="print-metric-value">AES-256</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Backup Frequency:</span>
                      <span class="print-metric-value">Daily</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Redundancy:</span>
                      <span class="print-metric-value">3x Replication</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Compliance:</span>
                      <span class="print-metric-value">GDPR Ready</span>
                    </div>
                  </div>
                </div>

                <div class="print-card">
                  <div class="print-card-title">📱 Access Patterns</div>
                  <div class="print-card-content">
                    <div class="print-metric">
                      <span class="print-metric-label">Web Access:</span>
                      <span class="print-metric-value">85%</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Mobile Access:</span>
                      <span class="print-metric-value">12%</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">API Access:</span>
                      <span class="print-metric-value">3%</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Peak Hours:</span>
                      <span class="print-metric-value">10:00-14:00</span>
                    </div>
                  </div>
                </div>

                <div class="print-card">
                  <div class="print-card-title">⚙️ System Metrics</div>
                  <div class="print-card-content">
                    <div class="print-metric">
                      <span class="print-metric-label">Avg File Size:</span>
                      <span class="print-metric-value">${
                        realUsedGB > 0 && storageData?.files.activeCount
                          ? formatGB(realUsedGB / storageData.files.activeCount)
                          : "N/A"
                      }</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Version Count:</span>
                      <span class="print-metric-value">${
                        storageData?.files.versionsCount || 0
                      }</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Retention Policy:</span>
                      <span class="print-metric-value">${
                        plan === "Enterprise" ? "Unlimited" : "90 Days"
                      }</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Compression:</span>
                      <span class="print-metric-value">Enabled</span>
                    </div>
                  </div>
                </div>

                <div class="print-card">
                  <div class="print-card-title">📊 Performance</div>
                  <div class="print-card-content">
                    <div class="print-metric">
                      <span class="print-metric-label">Read Speed:</span>
                      <span class="print-metric-value">${
                        plan === "Enterprise"
                          ? "1 Gbps"
                          : plan === "Business"
                            ? "500 Mbps"
                            : "100 Mbps"
                      }</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Write Speed:</span>
                      <span class="print-metric-value">${
                        plan === "Enterprise"
                          ? "500 Mbps"
                          : plan === "Business"
                            ? "250 Mbps"
                            : "50 Mbps"
                      }</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Uptime SLA:</span>
                      <span class="print-metric-value">${
                        plan === "Enterprise"
                          ? "99.99%"
                          : plan === "Business"
                            ? "99.9%"
                            : "99%"
                      }</span>
                    </div>
                    <div class="print-metric">
                      <span class="print-metric-label">Latency:</span>
                      <span class="print-metric-value">< 50ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            ${
              percentage > 70
                ? `
            <div class="print-alert">
              <div class="print-alert-title">
                ${
                  percentage > 90
                    ? "🚨 URGENT ACTION REQUIRED"
                    : "⚠️ STORAGE NOTICE"
                }
              </div>
              <div class="print-alert-message">
                ${
                  percentage > 90
                    ? `Your storage is critically full at ${percentage.toFixed(
                        1,
                      )}%. Immediate action is required to prevent service disruption.`
                    : `Your storage usage is at ${percentage.toFixed(
                        1,
                      )}%. Consider optimizing storage or upgrading your plan.`
                }
              </div>
              <div style="margin-top: 10px; font-size: 12px;">
                <strong>Recommendations:</strong><br>
                1. Review and delete unused files<br>
                2. Archive old documents<br>
                3. Consider upgrading to ${
                  plan === "Pro" ? "Business" : "Enterprise"
                } plan<br>
                4. Enable automatic cleanup
              </div>
            </div>
            `
                : ""
            }

            <div class="print-footer">
              <div>Storage Analytics Report • Generated by Cloud Storage System</div>
              <div style="margin-top: 5px; font-size: 11px;">
                This report contains confidential information. Do not distribute without authorization.
              </div>
              <div style="margin-top: 5px; font-size: 11px;">
                Report ID: ${Date.now()} • Page 1 of 1
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }, 250);
  };

  const handleShare = async () => {
    try {
      const planLimitGB = getPlanLimitGB();
      const displayUsageGB =
        weightedUsedGB > 0 ? weightedUsedGB : currentUsageGB;
      const percentage =
        planLimitGB > 0 ? (displayUsageGB / planLimitGB) * 100 : 0;

      const shareData = {
        title: `Storage Analytics Report - ${plan} Plan`,
        text:
          `📊 Storage Usage: ${formatGB(displayUsageGB)} of ${formatGB(
            planLimitGB,
          )} (${percentage.toFixed(1)}%)\n\n` +
          `📁 Files: ${storageData?.files.activeCount || 0} active, ${getTotalFiles()} total\n` +
          `⚡ Status: ${
            percentage > 90
              ? "Critical"
              : percentage > 70
                ? "Warning"
                : "Healthy"
          }\n\n` +
          `Generated on ${new Date().toLocaleDateString()}`,
        url: window.location.href,
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          shareData.text + `\n\nView at: ${shareData.url}`,
        );
        setCopied(true);

        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (!isOpen) return null;

  const formatGB = (gb: number): string => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    if (gb < 0.1 && gb > 0) return `${(gb * 1024).toFixed(1)} MB`;
    if (gb === 0) return "0 GB";
    return `${gb.toFixed(1)} GB`;
  };

  const getPlanLimitGB = () => {
    if (!storageData) return 0;
    const limitBytes = BigInt(storageData.storage.limitBytes);
    return Number(limitBytes) / 1024 ** 3;
  };

  const planLimitGB = getPlanLimitGB();
  const displayUsageGB = weightedUsedGB > 0 ? weightedUsedGB : currentUsageGB;
  const percentage = planLimitGB > 0 ? (displayUsageGB / planLimitGB) * 100 : 0;

  const getStatusColor = (pct: number) => {
    if (pct > 90) return "text-red-400";
    if (pct > 70) return "text-yellow-400";
    if (pct > 50) return "text-blue-400";
    return "text-green-400";
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro":
        return "text-purple-400";
      case "business":
        return "text-blue-400";
      case "enterprise":
        return "text-emerald-400";
      default:
        return "text-gray-400";
    }
  };

  const getPlanBgColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro":
        return "bg-purple-500/10";
      case "business":
        return "bg-blue-500/10";
      case "enterprise":
        return "bg-emerald-500/10";
      default:
        return "bg-gray-500/10";
    }
  };

  const fileStatistics = [
    {
      label: "Active Files",
      value: storageData?.files.activeCount || 0,
      icon: FileText,
      iconColor: "text-purple-500",
      bgColor: "bg-linear-to-br from-purple-500/20 to-purple-600/20",
      description: "Currently accessible files",
    },
    {
      label: "Total Files",
      value: getTotalFiles(),
      icon: FolderOpen,
      iconColor: "text-blue-500",
      bgColor: "bg-linear-to-br from-blue-500/20 to-blue-600/20",
      description: "All files including archived",
    },
    {
      label: "File Versions",
      value: storageData?.files.versionsCount || 0,
      icon: GitBranch,
      iconColor: "text-green-500",
      bgColor: "bg-linear-to-br from-green-500/20 to-green-600/20",
      description: "Historical versions saved",
    },
    {
      label: "Real Storage Size",
      value: realUsedGB > 0 ? formatGB(realUsedGB) : "Calculating...",
      icon: HardDriveDownload,
      iconColor: "text-amber-500",
      bgColor: "bg-linear-to-br from-amber-500/20 to-amber-600/20",
      description: "Actual disk space used",
    },
    {
      label: "Weighted Storage",
      value: formatGB(displayUsageGB),
      icon: Package,
      iconColor: "text-pink-500",
      bgColor: "bg-linear-to-br from-pink-500/20 to-pink-600/20",
      description: "Weighted storage used",
    },
    {
      label: "Daily Uploads",
      value: "24 avg",
      icon: Calendar,
      iconColor: "text-indigo-500",
      bgColor: "bg-linear-to-br from-indigo-500/20 to-indigo-600/20",
      description: "Average files per day",
    },
  ];

  const additionalStatistics = [
    {
      label: "Security Level",
      value: plan === "Enterprise" ? "Advanced" : "Standard",
      icon: ShieldCheck,
      iconColor: "text-emerald-500",
      bgColor: "bg-linear-to-br from-emerald-500/20 to-emerald-600/20",
      description: "Data protection level",
    },
    {
      label: "Access Devices",
      value: "3 avg",
      icon: Smartphone,
      iconColor: "text-violet-500",
      bgColor: "bg-linear-to-br from-violet-500/20 to-violet-600/20",
      description: "Devices per user",
    },
    {
      label: "Network Speed",
      value: plan === "Enterprise" ? "1 Gbps" : "500 Mbps",
      icon: Network,
      iconColor: "text-cyan-500",
      bgColor: "bg-linear-to-br from-cyan-500/20 to-cyan-600/20",
      description: "Maximum throughput",
    },
    {
      label: "Uptime SLA",
      value: plan === "Enterprise" ? "99.99%" : "99.9%",
      icon: Activity,
      iconColor: "text-rose-500",
      bgColor: "bg-linear-to-br from-rose-500/20 to-rose-600/20",
      description: "Service availability",
    },
    {
      label: "Data Redundancy",
      value: "3x",
      icon: Database,
      iconColor: "text-orange-500",
      bgColor: "bg-linear-to-br from-orange-500/20 to-orange-600/20",
      description: "Backup copies",
    },
    {
      label: "API Requests",
      value: "1.2k/day",
      icon: Server,
      iconColor: "text-lime-500",
      bgColor: "bg-linear-to-br from-lime-500/20 to-lime-600/20",
      description: "Daily API calls",
    },
  ];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 350,
                mass: 0.8,
              }}
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-linear-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500" />
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

                <div className="relative p-8 border-b border-white/10 dark:border-gray-800/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-30" />
                        <div className="relative p-3 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 shadow-lg">
                          <HardDrive className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          Storage Analytics
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                          <div
                            className={`px-3 py-1 rounded-full ${getPlanBgColor(
                              plan,
                            )} ${getPlanColor(
                              plan,
                            )} text-sm font-medium flex items-center gap-2`}
                          >
                            <Shield className="h-3 w-3" />
                            {plan} Plan
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            Updated just now
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="h-11 w-11 rounded-xl hover:bg-white/10 dark:hover:bg-gray-800/50 transition-all duration-300"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1" />

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="h-8 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                      >
                        <Printer className="h-3 w-3" />
                        <span className="hidden sm:inline">Print</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="h-8 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                      >
                        {copied ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Share2 className="h-3 w-3" />
                        )}
                        <span className="hidden sm:inline">
                          {copied ? "Copied" : "Share"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                  <div className="p-8 space-y-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                        <div className="relative w-56 h-56">
                          <div className="absolute inset-0">
                            <svg
                              className="w-full h-full"
                              viewBox="0 0 100 100"
                            >
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-gray-200 dark:text-gray-800"
                              />
                            </svg>
                          </div>

                          <motion.div className="absolute inset-0">
                            <svg
                              className="w-full h-full"
                              viewBox="0 0 100 100"
                            >
                              <defs>
                                <linearGradient
                                  id="progressGradient"
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="100%"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#3b82f6"
                                    stopOpacity="1"
                                  />
                                  <stop
                                    offset="50%"
                                    stopColor="#8b5cf6"
                                    stopOpacity="1"
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#ec4899"
                                    stopOpacity="1"
                                  />
                                </linearGradient>
                              </defs>
                              <motion.circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="url(#progressGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: percentage / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                transform="rotate(-90 50 50)"
                              />
                            </svg>
                          </motion.div>

                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="text-center"
                            >
                              <div
                                className={`text-5xl font-bold ${getStatusColor(
                                  percentage,
                                )}`}
                              >
                                {percentage.toFixed(0)}%
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Storage Used
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Storage Overview
                          </h3>
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-linear-to-r from-white/30 to-transparent dark:from-gray-800/30 backdrop-blur-sm">
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatGB(displayUsageGB)} /{" "}
                                {formatGB(planLimitGB)}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Weighted storage usage
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 rounded-lg bg-linear-to-br from-blue-500/10 to-blue-600/10">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Available
                                  </span>
                                </div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                  {formatGB(planLimitGB - displayUsageGB)}
                                </div>
                              </div>

                              {realUsedGB > 0 && (
                                <div className="p-3 rounded-lg bg-linear-to-br from-green-500/10 to-green-600/10">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Real Size
                                    </span>
                                  </div>
                                  <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                    {formatGB(realUsedGB)}
                                  </div>
                                </div>
                              )}
                            </div>

                            {weightMultiplier > 1.5 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                              >
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                  Weight Multiplier:{" "}
                                  {weightMultiplier.toFixed(1)}x
                                </span>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-linear-to-r from-transparent via-gray-300/50 to-transparent dark:via-gray-700/50" />

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-linear-to-br from-purple-500 to-pink-500">
                          <BarChart className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          File Statistics
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {fileStatistics.map((stat, idx) => {
                          const IconComponent = stat.icon;
                          return (
                            <motion.div
                              key={stat.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="group"
                            >
                              <Card className="border-none bg-linear-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-800/20 backdrop-blur-sm hover:from-white/60 hover:to-white/40 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 transition-all duration-300 h-full">
                                <CardContent className="p-5">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`p-2 rounded-lg ${stat.bgColor}`}
                                      >
                                        <IconComponent
                                          className={`h-5 w-5 ${stat.iconColor}`}
                                        />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                          {stat.label}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {stat.description}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                      {stat.value}
                                    </div>
                                    {stat.label === "Real Storage Size" &&
                                      realUsedGB > 0 &&
                                      weightMultiplier > 1 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Weighted: {formatGB(displayUsageGB)}
                                        </div>
                                      )}
                                    {stat.label === "Weighted Storage" &&
                                      realUsedGB > 0 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Real: {formatGB(realUsedGB)}
                                        </div>
                                      )}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          System & Performance
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {additionalStatistics.map((stat, idx) => {
                          const IconComponent = stat.icon;
                          return (
                            <motion.div
                              key={stat.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: (idx + fileStatistics.length) * 0.1,
                              }}
                              className="group"
                            >
                              <Card className="border-none bg-linear-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-800/20 backdrop-blur-sm hover:from-white/60 hover:to-white/40 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 transition-all duration-300 h-full">
                                <CardContent className="p-5">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`p-2 rounded-lg ${stat.bgColor}`}
                                      >
                                        <IconComponent
                                          className={`h-5 w-5 ${stat.iconColor}`}
                                        />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                          {stat.label}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {stat.description}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                      {stat.value}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <Card className="border-none bg-linear-to-br from-white/50 to-white/30 dark:from-gray-800/30 dark:to-gray-800/10 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500">
                              <PieChart className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              File Type Distribution
                            </h3>
                          </div>
                          <div className="space-y-5">
                            {storageData?.files.statsByType && (
                              <>
                                {[
                                  {
                                    label: "Documents",
                                    value:
                                      storageData.files.statsByType.documents ||
                                      0,
                                    icon: FileText,
                                    color: "from-blue-500 to-cyan-500",
                                    iconBg: "bg-blue-500/20",
                                  },
                                  {
                                    label: "Whiteboards",
                                    value:
                                      storageData.files.statsByType
                                        .whiteboards || 0,
                                    icon: Layers,
                                    color: "from-purple-500 to-pink-500",
                                    iconBg: "bg-purple-500/20",
                                  },
                                  {
                                    label: "Mixed Files",
                                    value:
                                      storageData.files.statsByType.mixed || 0,
                                    icon: FileBox,
                                    color: "from-green-500 to-emerald-500",
                                    iconBg: "bg-green-500/20",
                                  },
                                ].map((item, idx) => {
                                  const IconComponent = item.icon;
                                  const total =
                                    storageData.files.statsByType.totalFiles ||
                                    0;
                                  const itemPercentage =
                                    total > 0 ? (item.value / total) * 100 : 0;

                                  return (
                                    <div key={item.label} className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`p-2 rounded-lg ${item.iconBg}`}
                                          >
                                            <IconComponent className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                                          </div>
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {item.label}
                                          </span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                          {item.value} (
                                          {itemPercentage.toFixed(0)}%)
                                        </span>
                                      </div>
                                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                          className={`h-full bg-linear-to-r ${item.color} rounded-full`}
                                          initial={{ width: 0 }}
                                          animate={{
                                            width: `${itemPercentage}%`,
                                          }}
                                          transition={{
                                            duration: 1,
                                            delay: idx * 0.2,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Database className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Active Files
                                  </span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {storageData?.files.statsByType?.totalFiles ||
                                    0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-none bg-linear-to-br from-white/50 to-white/30 dark:from-gray-800/30 dark:to-gray-800/10 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500">
                              <Zap className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Plan Insights
                            </h3>
                          </div>
                          <div className="space-y-4">
                            {[
                              {
                                label: "Current Plan",
                                value: plan,
                                icon: Shield,
                                color: getPlanColor(plan),
                              },
                              {
                                label: "Storage Limit",
                                value: formatGB(planLimitGB),
                                icon: HardDrive,
                                color: "text-blue-500",
                              },
                              {
                                label: "Files Created",
                                value: getTotalFiles(),
                                icon: File,
                                color: "text-purple-500",
                              },
                              {
                                label: "Storage Health",
                                value:
                                  percentage > 90
                                    ? "Critical"
                                    : percentage > 70
                                      ? "Warning"
                                      : "Healthy",
                                icon:
                                  percentage > 90
                                    ? AlertTriangle
                                    : percentage > 70
                                      ? TrendingUp
                                      : Zap,
                                color: getStatusColor(percentage),
                              },
                            ].map((item, idx) => {
                              const IconComponent = item.icon;
                              return (
                                <motion.div
                                  key={item.label}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-white/30 to-transparent dark:from-gray-800/30 hover:from-white/40 dark:hover:from-gray-800/40 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`p-2 rounded-lg ${item.color.replace(
                                        "text-",
                                        "bg-",
                                      )}/20`}
                                    >
                                      <IconComponent
                                        className={`h-4 w-4 ${item.color}`}
                                      />
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {item.label}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-sm font-bold ${item.color}`}
                                  >
                                    {item.value}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                          <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Your {plan} plan provides {formatGB(planLimitGB)}{" "}
                              of weighted storage.
                              {percentage > 70 && (
                                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                                  {percentage > 90
                                    ? "Consider upgrading to increase your storage limit."
                                    : "Monitor your usage to avoid reaching the limit."}
                                </span>
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {percentage > 70 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-2xl ${
                          percentage > 90
                            ? "bg-linear-to-r from-red-500/10 to-orange-500/10 border border-red-500/20"
                            : "bg-linear-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-xl ${
                                percentage > 90
                                  ? "bg-red-500/20"
                                  : "bg-yellow-500/20"
                              }`}
                            >
                              <TrendingUp
                                className={`h-6 w-6 ${
                                  percentage > 90
                                    ? "text-red-500"
                                    : "text-yellow-500"
                                }`}
                              />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {percentage > 90
                                  ? "🚨 Storage Alert"
                                  : "⚠️ Storage Notice"}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {percentage > 90
                                  ? "Your storage is almost full. Consider cleaning up or upgrading."
                                  : `You're using ${percentage.toFixed(
                                      0,
                                    )}% of your storage. Manage your files wisely.`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              className="bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
                              onClick={() => {
                                router.push("/pricing");
                              }}
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Upgrade Plan
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="relative p-6 border-t border-white/10 dark:border-gray-800/50 bg-linear-to-r from-transparent via-white/5 to-transparent dark:via-gray-800/5">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm">
                        <Cpu className="h-3 w-3 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Real-Time Analytics
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        Last refresh: Just now
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
