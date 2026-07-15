import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FolderLock,
  Plus,
  Trash2,
  FileText,
  Eye,
  EyeOff,
  CloudLightning,
  Sparkles,
  Search,
  Loader2,
  CheckCircle,
  FileCheck2,
  WifiOff
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/dashboard/DashboardLayout";

export const Route = createFileRoute("/more-features/documents")({
  head: () => ({
    meta: [
      { title: "Document Vault · Aria" },
      { name: "description", content: "Store passports, digital visas, flight vouchers, and hotel reservations securely." }
    ]
  }),
  component: DocumentVaultPage,
});

interface SecureDocument {
  id: string;
  category: "Passport" | "Visa" | "Flight Ticket" | "Hotel Booking";
  name: string;
  fileName: string;
  uploadedAt: string;
  offlineAvailable: boolean;
  fileSize: string;
}

function DocumentVaultPage() {
  const [docs, setDocs] = useState<SecureDocument[]>(() => {
    try {
      const raw = localStorage.getItem("aria_secure_documents");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("aria_secure_documents", JSON.stringify(docs));
  }, [docs]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [uploading, setUploading] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<SecureDocument["category"]>("Flight Ticket");
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    setUploading(true);
    setTimeout(() => {
      const newDoc: SecureDocument = {
        id: crypto.randomUUID(),
        category: newDocCategory,
        name: newDocName.trim(),
        fileName: `${newDocName.trim().toLowerCase().replace(/\s+/g, "_")}.pdf`,
        uploadedAt: new Date().toISOString().split("T")[0],
        offlineAvailable: true,
        fileSize: `${((newDocName.length * 3 + 12) / 10).toFixed(1)} MB`
      };

      setDocs(prev => [newDoc, ...prev]);
      setNewDocName("");
      setUploading(false);
      toast.success(`"${newDoc.name}" scanned & encrypted successfully!`);
    }, 1500);
  };

  const handleToggleOffline = (id: string, name: string) => {
    setDocs(prev => prev.map(d => {
      if (d.id === id) {
        const nextState = !d.offlineAvailable;
        toast.success(`"${name}" ${nextState ? "downloaded for offline use" : "removed from local cache"}`);
        return { ...d, offlineAvailable: nextState };
      }
      return d;
    }));
  };

  const handleDelete = (id: string, name: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    toast.error(`Deleted "${name}"`);
  };

  const categories = ["All", "Passport", "Visa", "Flight Ticket", "Hotel Booking"];

  const filtered = docs.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout activeLabel="More Features">
      <div className="space-y-8 pb-16">
        
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/more-features"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-white/70 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="text-[10px] tracking-wider text-indigo-400 uppercase font-semibold">Security Hub</div>
              <h1 className="font-display text-3xl">Secure Document Vault</h1>
            </div>
          </div>
        </div>

        {/* Configurations grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Upload panel */}
          <div className="rounded-2xl glass p-6 border border-white/5 space-y-5 h-fit">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FolderLock className="h-4 w-4 text-gold" />
              Upload Document
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="docName">Document Name</label>
                <input
                  id="docName"
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g., John Vaccine Certificate"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white placeholder:text-white/40 focus:border-gold/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] tracking-wider text-white/40 uppercase font-mono" htmlFor="docCategory">Category</label>
                <select
                  id="docCategory"
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Passport" className="bg-[oklch(0.08_0.02_250)]">Passport Scan</option>
                  <option value="Visa" className="bg-[oklch(0.08_0.02_250)]">eVisa / Visa</option>
                  <option value="Flight Ticket" className="bg-[oklch(0.08_0.02_250)]">Flight Ticket</option>
                  <option value="Hotel Booking" className="bg-[oklch(0.08_0.02_250)]">Hotel Booking</option>
                </select>
              </div>

              {/* Drag n drop simulated */}
              <div className="p-4 border border-dashed border-white/10 rounded-xl text-center space-y-2 bg-white/5">
                <FileText className="h-6 w-6 text-white/30 mx-auto" />
                <div className="text-[9px] text-white/50">PDF, JPG, PNG up to 10MB</div>
                <div className="text-[8px] text-gold font-bold">Select File (Simulated)</div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-[oklch(0.13_0.025_250)] transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ background: "var(--gradient-sunrise)", boxShadow: "var(--shadow-glow-gold)" }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Encrypting...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Upload & Secure
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Documents Directory */}
          <div className="lg:col-span-2 rounded-2xl glass p-6 border border-white/5 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                      selectedCategory === c
                        ? "bg-gold text-[oklch(0.13_0.025_250)] font-semibold"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {c === "All" ? "All Documents" : `${c}s`}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vault..."
                  className="rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-[10px] text-white focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filtered.map(doc => (
                  <motion.div
                    layout
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                        <FileCheck2 className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-semibold text-white truncate">{doc.name}</h4>
                        <div className="flex items-center gap-2 text-[9px] text-white/40 font-mono mt-0.5">
                          <span>{doc.category}</span>
                          <span>•</span>
                          <span>{doc.fileSize}</span>
                          <span>•</span>
                          <span>Uploaded: {doc.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Offline download toggle */}
                      <button
                        onClick={() => handleToggleOffline(doc.id, doc.name)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          doc.offlineAvailable
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-white/5 border-white/5 text-white/30 hover:text-white"
                        }`}
                        title={doc.offlineAvailable ? "Available Offline" : "Online Only"}
                      >
                        {doc.offlineAvailable ? <CheckCircle className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                      </button>

                      {/* View document simulated */}
                      <button
                        onClick={() => {
                          setViewingFileId(viewingFileId === doc.id ? null : doc.id);
                          toast.info(`AES-256 decryption initialized. Decrypting ${doc.fileName}...`);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/60 hover:text-white transition cursor-pointer"
                      >
                        {viewingFileId === doc.id ? <EyeOff className="h-3.5 w-3.5 text-gold" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>

                      {/* Delete document */}
                      <button
                        onClick={() => handleDelete(doc.id, doc.name)}
                        className="p-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 text-red-400 hover:text-red-300 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="text-center py-12 text-[10px] text-white/40">
                  No encrypted documents indexed.
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Simulated Document Viewer Modal */}
        <AnimatePresence>
          {viewingFileId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-6 rounded-2xl border border-gold/20 bg-gold/5 backdrop-blur-md space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <FolderLock className="h-4 w-4 text-gold animate-pulse" />
                  <span className="text-xs font-bold font-mono text-gold uppercase tracking-wider">AES-256 Decrypted Output</span>
                </div>
                <button
                  onClick={() => setViewingFileId(null)}
                  className="text-[10px] hover:underline text-white/50 cursor-pointer"
                >
                  Close Secure Stream
                </button>
              </div>

              {/* Dynamic decrypted content */}
              {(() => {
                const doc = docs.find(d => d.id === viewingFileId);
                if (!doc) return null;
                const cleanName = doc.name.toUpperCase().replace(/\s+SCAN|\s+PDF|\s+COPY/g, "");
                return (
                  <div className="p-8 border border-white/5 bg-black/60 rounded-xl font-mono text-[10px] text-white/70 space-y-3">
                    <div className="text-center border-b border-white/5 pb-2 font-bold text-white uppercase text-xs">
                      {doc.category} Document
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-white/35 block">DOCUMENT NAME:</span>
                        <span>{cleanName}</span>
                      </div>
                      <div>
                        <span className="text-white/35 block">DOCUMENT ID:</span>
                        <span>SEC-{doc.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-white/35 block">UPLOADED DATE:</span>
                        <span>{doc.uploadedAt}</span>
                      </div>
                      <div>
                        <span className="text-white/35 block">OFFLINE CACHE:</span>
                        <span>{doc.offlineAvailable ? "ENABLED" : "DISABLED"}</span>
                      </div>
                    </div>
                    <div className="text-[8px] text-white/30 pt-3 border-t border-white/5 leading-relaxed">
                      DIGITAL SCAN VERIFIED THROUGH HYPERSECURE BLOCKCHAIN LEDGER. ENCRYPTION HASH: SHA-256 ({doc.id.replace(/-/g, "")}...).
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
