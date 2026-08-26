import React, { useState } from "react";
import { Code2, Download, Copy, Check, FileText, CheckCircle2 } from "lucide-react";
import { toolkitFiles, SourceFile } from "../data/toolkitFiles";

interface CodeExporterViewProps {
  onDownloadZip: () => void;
}

export const CodeExporterView: React.FC<CodeExporterViewProps> = ({ onDownloadZip }) => {
  const [selectedFile, setSelectedFile] = useState<SourceFile>(toolkitFiles[0]);
  const [copied, setCopied] = useState(false);

  const copyFileContent = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Bento Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 text-white font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <span>Python Source Code Repository & Packaging</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Modular enterprise codebase compatible with Python 3.10+, Typer, Rich, and Proxmoxer REST API.
          </p>
        </div>

        <button
          onClick={onDownloadZip}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded-xl flex items-center space-x-2 shadow-md shadow-indigo-900/30 transition"
        >
          <Download className="w-4 h-4" />
          <span>DOWNLOAD ALL FILES (.ZIP)</span>
        </button>
      </div>

      {/* Code Inspector Split Bento View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-sm backdrop-blur min-h-[500px]">
        {/* File Tree Sidebar */}
        <div className="lg:col-span-1 bg-slate-950/80 border-r border-slate-800 p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider px-2 py-1.5 font-mono">
            Repository Files ({toolkitFiles.length})
          </div>
          {toolkitFiles.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition ${
                selectedFile.path === file.path
                  ? "bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <span className="truncate">{file.filename}</span>
              <span className="text-[10px] text-slate-500 uppercase">{file.category}</span>
            </button>
          ))}
        </div>

        {/* Code Content Viewer */}
        <div className="lg:col-span-3 flex flex-col bg-slate-900/40">
          <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-white font-semibold">{selectedFile.path}</span>
              <p className="text-[11px] text-slate-400">{selectedFile.description}</p>
            </div>
            <button
              onClick={copyFileContent}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 flex items-center space-x-1 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <pre className="p-5 bg-black/95 text-slate-200 font-mono text-xs overflow-x-auto flex-1 leading-relaxed max-h-[500px]">
            {selectedFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
