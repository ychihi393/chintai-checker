"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import html2canvas from "html2canvas";

export default function Home() {
  const [estimateFile, setEstimateFile] = useState<File | null>(null);
  const [drawingFile, setDrawingFile] = useState<File | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { totalCurrent, totalTarget, totalDiff } = useMemo(() => {
    if (!items || items.length === 0) return { totalCurrent: 0, totalTarget: 0, totalDiff: 0 };
    const current = items.reduce((sum, item) => sum + (Number(item.current) || 0), 0);
    const target = items.reduce((sum, item) => sum + (Number(item.target) || 0), 0);
    return { totalCurrent: current, totalTarget: target, totalDiff: current - target };
  }, [items]);

  const run = async () => {
    if (!estimateFile) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("estimateFile", estimateFile);
    if (drawingFile) fd.append("drawingFile", drawingFile);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success && json.data.items) setItems(json.data.items);
      else alert("解析できませんでした。別の画像を試してください。");
    } catch (e) { alert("エラーが発生しました"); }
    setLoading(false);
  };

  const saveImg = async () => {
    if (!resultRef.current) return;
    await new Promise(resolve => setTimeout(resolve, 100));
    const canvas = await html2canvas(resultRef.current, { backgroundColor: "#ffffff", scale: 2 });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "result.png";
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 pb-20 font-sans">
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white pt-10 pb-20 px-6 rounded-b-[40px] shadow-xl text-center relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs font-bold tracking-widest opacity-80 mb-2 border border-white/20 inline-block px-3 py-1 rounded-full">AI REAL ESTATE CHECKER</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">賃貸見積もりチェッカー</h1>
          <p className="text-blue-100 text-sm opacity-90">スマホで撮るだけ。AIが適正価格を即診断。</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto -mt-10 px-4 relative z-20">
        <div className="bg-white rounded-[30px] shadow-2xl p-6 md:p-8 border border-slate-100">
          {items.length === 0 ? (
            <div className="space-y-6">
              <label className="block p-8 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/50 text-center hover:bg-indigo-50 transition-colors cursor-pointer">
                <input type="file" onChange={(e)=>setEstimateFile(e.target.files?.[0]||null)} className="hidden"/>
                <div className="text-4xl mb-2">📄</div>
                <p className="font-bold text-indigo-900">見積書の写真 (必須)</p>
                <p className="text-xs text-indigo-500 mt-1">{estimateFile ? `✅ ${estimateFile.name}` : "タップして選択"}</p>
              </label>

              <label className="block p-4 border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/50 text-center hover:bg-emerald-50 transition-colors cursor-pointer">
                <input type="file" onChange={(e)=>setDrawingFile(e.target.files?.[0]||null)} className="hidden"/>
                <p className="font-bold text-emerald-900">🏠 募集図面 (任意)</p>
                <p className="text-xs text-emerald-600">{drawingFile ? `✅ ${drawingFile.name}` : "あると精度アップ"}</p>
              </label>

              <button onClick={run} disabled={!estimateFile || loading} 
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${loading || !estimateFile ? "bg-slate-300" : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.02]"}`}>
                {loading ? "AI解析中..." : "診断スタート ✨"}
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div ref={resultRef} className="bg-white p-6 rounded-xl border border-slate-100">
                <div className="bg-slate-900 text-white p-6 rounded-xl text-center shadow-lg mb-6">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Reduction</p>
                  <div className="flex justify-center items-end gap-1">
                    <span className="text-yellow-400 text-2xl font-bold">▼</span>
                    <span className="text-5xl font-extrabold">{totalDiff.toLocaleString()}</span>
                    <span className="text-sm font-bold mb-2">円</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">適正価格: {totalTarget.toLocaleString()}円</p>
                </div>

                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className={`p-4 rounded-lg border flex justify-between items-start gap-3 ${item.current > item.target ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${item.current > item.target ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                            {item.current > item.target ? "!" : "✓"}
                          </span>
                          <span className="font-bold text-sm text-slate-700">{item.name}</span>
                        </div>
                        {item.current > item.target && <p className="text-xs text-red-600 mt-1 pl-7">{item.reason}</p>}
                      </div>
                      <div className="text-right">
                        {item.current > item.target && <p className="text-xs text-slate-400 line-through">{item.current.toLocaleString()}</p>}
                        <p className="font-bold text-slate-700">{item.target.toLocaleString()}<span className="text-[10px]">円</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-dashed text-center text-[10px] text-slate-300">Powered by Gemini AI</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={saveImg} className="py-3 border-2 border-slate-100 rounded-xl font-bold text-slate-600 text-sm hover:bg-slate-50">画像保存</button>
                <button onClick={()=>{setItems([]);setEstimateFile(null);}} className="py-3 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm hover:bg-slate-200">もう一度</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}