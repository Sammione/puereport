"use client";
import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Loader2, Download, AlertCircle, Eye, Send, X, Zap, Sparkles, Shield, BarChart3, Globe } from 'lucide-react';
import * as mammoth from 'mammoth';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'ai' | 'user', message: string, status?: 'loading' | 'success' | 'error'}[]>([
    { role: 'ai', message: 'Report is ready. Let me know if you want to change anything.' }
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api'
    : '/api');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setErrorMessage('');
      setDownloadUrl(null);
      setBlob(null);
    }
  };

  const decodePreview = async (targetBlob: Blob) => {
    try {
      const arrayBuffer = await targetBlob.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setPreviewHtml(result.value);
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewHtml("<p class='text-red-500 text-center'>Error showing preview.</p>");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('processing');
      const response = await fetch(`${API_BASE}/generate_report`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to generate report');
      }

      const sessId = response.headers.get("X-Session-ID");
      setSessionId(sessId);

      const resBlob = await response.blob();
      setBlob(resBlob);
      const url = window.URL.createObjectURL(resBlob);
      setDownloadUrl(url);
      setStatus('done');
      
      await decodePreview(resBlob);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || "An error occurred");
    }
  };

  const handleRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !sessionId) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', message: userMsg }]);
    
    setChatHistory(prev => [...prev, { role: 'ai', message: 'Updating report...', status: 'loading' }]);

    try {
      const response = await fetch(`${API_BASE}/revise_report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          instruction: userMsg
        }),
      });

      if (!response.ok) throw new Error("Update failed");

      const resBlob = await response.blob();
      setBlob(resBlob);
      const url = window.URL.createObjectURL(resBlob);
      setDownloadUrl(url);
      
      await decodePreview(resBlob);

      setChatHistory(prev => {
        const newHist = [...prev];
        newHist.pop(); // Remove loading
        return [...newHist, { role: 'ai', message: 'Report updated based on your changes.', status: 'success' }];
      });
    } catch (err: any) {
      setChatHistory(prev => {
        const newHist = [...prev];
        newHist.pop();
        return [...newHist, { role: 'ai', message: `Error: ${err.message}`, status: 'error' }];
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#020205] text-slate-200 flex flex-col items-center justify-center font-sans overflow-hidden relative selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full mix-blend-color-dodge filter blur-[140px] animate-[pulse_8s_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-purple-900/10 rounded-full mix-blend-color-dodge filter blur-[120px] animate-[pulse_10s_infinite_1s]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="z-10 w-full max-w-2xl px-6 py-12 md:py-20 animate-in fade-in duration-1000">
        <div className="relative">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-indigo-600 to-indigo-400 p-[1px] shadow-2xl shadow-indigo-500/20">
                <div className="w-full h-full bg-[#020205] rounded-[23px] flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
            </div>
            <h1 className="text-7xl font-bold tracking-tight text-white mb-2 font-outfit">
              DREEF<span className="text-indigo-500">.</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium tracking-wide">
              PUE Report Generator<br/>
              <span className="text-slate-500 font-normal">Professional Reports from Excel Data</span>
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-[#0A0A12]/40 backdrop-blur-3xl p-1 rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden transition-all duration-500">
            <div className="bg-gradient-to-b from-white/[0.08] to-transparent p-10 rounded-[47px]">
              
              <div className="relative group mb-8">
                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept=".xlsx,.xls" />
                <div className={`relative border border-dashed rounded-[32px] p-10 transition-all duration-500 flex flex-col items-center justify-center overflow-hidden ${
                  file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-white/[0.02]'
                }`}>
                  <div className={`mb-6 p-5 rounded-2xl transition-all duration-700 ${
                    file ? 'bg-indigo-50 text-white rotate-0 scale-110 shadow-2xl shadow-indigo-500/30' : 'bg-slate-900/50 text-slate-500 group-hover:scale-105 group-hover:text-slate-400 border border-white/5'
                  }`}>
                    {file ? <FileText className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {file ? file.name : 'Upload Excel Data'}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm">
                      {file ? `${(file.size / 1024).toFixed(1)} KB uploaded` : 'Select your Excel survey file'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || status === 'uploading' || status === 'processing'}
                className="w-full relative py-5 rounded-[24px] font-bold text-lg tracking-tight bg-white text-black hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-500 transition-all duration-500 transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden"
              >
                {(status === 'uploading' || status === 'processing') ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> 
                    <span className="animate-pulse">{status === 'uploading' ? 'Reading File...' : 'Creating Report...'}</span>
                  </>
                ) : (
                  <>
                    Create Report
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                  </>
                )}
              </button>

              {status === 'done' && (
                <div className="mt-10 pt-10 border-t border-white/5 animate-in fade-in zoom-in duration-700">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-inner">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Report Finished</h4>
                      <p className="text-slate-500 font-medium">Your report is ready to download.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setShowPreview(true)} className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 border border-white/5 text-slate-300 font-bold transition-all transform hover:-translate-y-0.5">
                      <Eye className="w-5 h-5" /> Preview
                    </button>
                    <a href={downloadUrl!} download={`Report_${file?.name.split('.')[0]}.docx`} className="py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl flex items-center justify-center gap-2 text-white font-bold transition-all transform hover:-translate-y-0.5 shadow-xl shadow-indigo-600/20">
                      <Download className="w-5 h-5" /> Download
                    </a>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="mt-8 p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl flex items-center gap-4 animate-in shake duration-500">
                  <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                  <p className="text-rose-200/80 text-sm font-medium leading-relaxed">{errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in backdrop-blur-2xl bg-black/60 duration-500">
          <div className="bg-[#FCFCFD] w-full max-w-7xl h-full rounded-[40px] flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/20">
            
            <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#020205] rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-slate-900 tracking-tight">Preview Report</h3>
                  <p className="text-slate-500 text-sm font-medium">Check the details and make changes</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPreview(false)} 
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </header>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Document Viewing Area */}
              <div className="flex-1 p-10 overflow-y-auto bg-slate-50/50">
                <div className="max-w-[1000px] mx-auto bg-white p-20 rounded-[48px] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100/50 text-slate-800 min-h-full">
                  <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-slate-700 font-sans leading-relaxed" 
                       dangerouslySetInnerHTML={{ __html: previewHtml }}>
                  </div>
                </div>
              </div>
              
              {/* Intelligence Assistant Panel */}
              <aside className="w-[420px] bg-white border-l border-slate-100 flex flex-col overflow-hidden shadow-[-10px_0_40px_rgba(0,0,0,0.02)]">
                <div className="p-8 border-b border-slate-50 bg-indigo-50/20">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm tracking-widest uppercase mb-2">
                    <Sparkles className="w-4 h-4" /> AI Assistant
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                    Tell the AI to change any text or data in the report.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col">
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className={`animate-in slide-in-from-bottom-2 duration-500 overflow-hidden ${
                      chat.role === 'user' ? 'self-end' : 'self-start'
                    }`}>
                      <div className={`p-5 rounded-[24px] max-w-[340px] text-[15px] font-medium leading-relaxed ${
                        chat.role === 'user' 
                          ? 'bg-slate-900 text-white rounded-tr-none shadow-lg' 
                          : chat.status === 'loading'
                            ? 'bg-indigo-50 text-indigo-400 rounded-tl-none animate-pulse border border-indigo-100'
                            : chat.status === 'success'
                              ? 'bg-emerald-50 text-emerald-900 rounded-tl-none border border-emerald-100'
                              : 'bg-indigo-50 text-indigo-950 rounded-tl-none border border-indigo-100'
                      }`}>
                        {chat.message}
                      </div>
                      {chat.status === 'success' && (
                        <div className="mt-3 flex justify-start pl-1">
                            <button onClick={() => document.getElementById('finalDownload')?.click()} className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline px-1">
                                Download Updated Report →
                            </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                  <form onSubmit={handleRevision} className="relative">
                    <input 
                      value={chatInput} 
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your changes here..." 
                      className="w-full bg-white border border-slate-200 text-slate-900 text-[15px] rounded-2xl py-4.5 px-6 pr-14 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium placeholder-slate-400 shadow-sm" 
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50">
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          </div>
          <a id="finalDownload" href={downloadUrl!} download={`Report_${file?.name.split('.')[0]}.docx`} className="hidden" />
        </div>
      )}
    </main>
  );
}
    </main>
  );
}
