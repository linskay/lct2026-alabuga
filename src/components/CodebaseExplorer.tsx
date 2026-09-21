import React, { useState } from "react";
import { KMP_FILES, CodeFile } from "../kmpCodebase";
import {
  FileCode,
  FolderTree,
  Copy,
  Check,
  Download,
  Search,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import JSZip from "jszip";

export const CodebaseExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(KMP_FILES[1]); // DataModels by default
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isZipping, setIsZipping] = useState(false);

  const categories = ["All", "Models", "Network", "MVI & State", "Compose UI", "3D Expect/Actual", "Gradle", "Docs"];

  const filteredFiles = KMP_FILES.filter((file) => {
    const matchesCategory = activeCategory === "All" || file.category === activeCategory;
    const matchesSearch =
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add each file into the zip
      KMP_FILES.forEach((file) => {
        zip.file(`AlabugaArenaKMP/${file.path}`, file.content);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Alabuga_Negotiation_Arena_KMP_Project.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP creation failed", err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0d0e12] text-slate-200">
      {/* Top action bar */}
      <div className="h-14 border-b border-[#232736] bg-[#14161f] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7b2cbf]/20 border border-[#7b2cbf] flex items-center justify-center text-[#9d4edd]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Архитектура & Исходный код KMP
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#7b2cbf]/30 text-[#00f0ff] font-mono border border-[#7b2cbf]/40">
                Kotlin Multiplatform + Compose MP
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Таргеты: Android (SceneView), iOS (SceneKit), Web Wasm (Canvas/Three.js) | ОЭЗ «Алабуга»
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="px-3 py-1.5 rounded-lg bg-[#7b2cbf] hover:bg-[#9d4edd] text-white text-xs font-semibold shadow-[0_0_15px_rgba(123,44,191,0.4)] flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#00f0ff]" />
            {isZipping ? "Архивация..." : "Скачать проект KMP (.zip)"}
          </button>
        </div>
      </div>

      {/* Main split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Tree and Filters */}
        <div className="w-80 border-r border-[#232736] bg-[#10121a] flex flex-col">
          {/* Search bar */}
          <div className="p-3 border-b border-[#232736]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по кодовой базе..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0d0e12] border border-[#232736] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7b2cbf]"
              />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1 mt-2.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                    activeCategory === cat
                      ? "bg-[#7b2cbf] border-[#7b2cbf] text-white font-semibold"
                      : "bg-[#14161f] border-[#232736] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-[#7b2cbf]/15 border-[#7b2cbf] text-white shadow-[0_0_12px_rgba(123,44,191,0.25)]"
                      : "border-transparent bg-transparent text-slate-400 hover:bg-[#14161f] hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate flex items-center gap-2">
                      <FileCode
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? "text-[#00f0ff]" : "text-[#7b2cbf]"
                        }`}
                      />
                      {file.filename}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-slate-400 font-mono border border-slate-800">
                      {file.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1 pl-5">
                    {file.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Architecture Highlights Note */}
          <div className="p-3 border-t border-[#232736] bg-[#0d0e12]/80 text-[11px] text-slate-400 space-y-1">
            <div className="text-white font-semibold flex items-center gap-1.5 text-xs text-[#9d4edd]">
              <FolderTree className="w-3.5 h-3.5 text-[#00f0ff]" /> Спецификация KMP:
            </div>
            <p className="text-slate-400">
              • 100% Kotlin Multiplatform (Compose MP)
              <br />• Модели: kotlinx.serialization
              <br />• Сеть: Ktor Client 3.x + MockEngine
              <br />• 3D: expect/actual (SceneView / Three.js)
            </p>
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="flex-1 flex flex-col bg-[#0b0c10] overflow-hidden">
          {/* Header of selected file */}
          <div className="h-11 border-b border-[#232736] bg-[#12141c] px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
              <span className="text-[#00f0ff]">{selectedFile.path}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1d29] hover:bg-[#252a3a] border border-[#282c3c] text-xs text-slate-300 transition-all font-mono"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[#10b981]">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать код</span>
                </>
              )}
            </button>
          </div>

          {/* Code content */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 leading-relaxed select-text">
            <pre className="text-[12px]">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
