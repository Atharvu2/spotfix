"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, MapPin, CheckCircle, AlertTriangle, ArrowRight, X, Image as ImageIcon, Map as MapIcon, Crosshair, Home as HomeIcon, User as UserIcon, List, ThumbsUp, ShieldAlert, Sparkles, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type TabState = "FEED" | "REPORT" | "PROFILE";
type FlowState = "START" | "ANALYZING" | "CONFIRM_ISSUE" | "CONFIRM_LOCATION" | "DUPLICATE_CHECK" | "DUPLICATE_FOUND" | "ISSUE_VIEW" | "TAKING_AFTER_PHOTO" | "VERIFYING_FIX" | "FIX_CONFIRMED";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabState>("FEED");
  const [feedView, setFeedView] = useState<"LIST" | "MAP">("LIST");
  
  const [flow, setFlow] = useState<FlowState>("START");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("Locating...");
  const [detectedIssue, setDetectedIssue] = useState<{issue: string, confidence: number, description: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  const startReport = () => {
    setActiveTab("REPORT");
    setFlow("START");
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>, isAfter: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        
        if (isAfter) {
          setAfterImage(base64Image);
          setFlow("VERIFYING_FIX");
          setTimeout(() => setFlow("FIX_CONFIRMED"), 3000);
        } else {
          setCapturedImage(base64Image);
          setFlow("ANALYZING");
          
          try {
            const res = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64Image })
            });
            const data = await res.json();
            
            if (data.error) setDetectedIssue({ issue: data.issue, confidence: 0, description: data.description });
            else setDetectedIssue(data);
          } catch (err) {
            setDetectedIssue({ issue: "SYS_ERR", confidence: 0, description: "Connection failed to analysis cluster." });
          }
          setFlow("CONFIRM_ISSUE");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmIssue = () => {
    setFlow("CONFIRM_LOCATION");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => setLocationName("GEO_UNAVAILABLE")
      );
    } else setLocationName("SYS_UNSUPPORTED");
  };

  const pageVariants = {
    initial: { opacity: 0, filter: "blur(4px)" },
    in: { opacity: 1, filter: "blur(0px)" },
    out: { opacity: 0, filter: "blur(4px)" }
  };

  return (
    <main className="flex-1 flex flex-col h-full relative bg-black text-white font-sans overflow-hidden bg-noise">
      
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 z-30 bg-black/80 backdrop-blur-md">
         <div className="flex items-center space-x-3">
           <div className="w-8 h-8 border border-brand-primary flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.3)]">
             <ShieldAlert className="w-4 h-4 text-brand-primary" />
           </div>
           <h1 className="text-xl font-serif tracking-[0.2em] uppercase font-bold text-white">SPOT<span className="text-brand-primary">FIX</span></h1>
         </div>
         {activeTab === "REPORT" && flow !== "START" && (
           <button onClick={() => { setFlow("START"); setActiveTab("FEED"); }} className="p-2 border border-white/10 hover:bg-white/5 transition-colors">
             <X className="w-4 h-4 text-white/70" />
           </button>
         )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24 relative z-10 no-scrollbar gradient-descent">
        <AnimatePresence mode="wait">
          
          {/* --- FEED TAB --- */}
          {activeTab === "FEED" && (
            <motion.div key="feed" variants={pageVariants} initial="initial" animate="in" exit="out" transition={{ duration: 0.3 }} className="p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                 <div className="flex space-x-4">
                   <button onClick={() => setFeedView("LIST")} className={cn("text-xs font-mono tracking-widest uppercase pb-1 transition-all", feedView === "LIST" ? "text-brand-primary border-b border-brand-primary" : "text-white/40 hover:text-white/60")}>
                     [ LOG ]
                   </button>
                   <button onClick={() => setFeedView("MAP")} className={cn("text-xs font-mono tracking-widest uppercase pb-1 transition-all", feedView === "MAP" ? "text-brand-primary border-b border-brand-primary" : "text-white/40 hover:text-white/60")}>
                     [ GRID ]
                   </button>
                 </div>
              </div>

              {feedView === "LIST" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black border border-white/10 p-5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full" />
                      <span className="text-4xl font-serif font-bold text-white tracking-tighter">12</span>
                      <span className="block text-[10px] font-mono tracking-widest text-white/50 uppercase mt-2">ACTIVE_ISSUES</span>
                    </div>
                    <div className="bg-brand-primary/10 border border-brand-primary/40 p-5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/20 rounded-bl-full" />
                      <span className="text-4xl font-serif font-bold text-brand-primary tracking-tighter shadow-brand-primary">38</span>
                      <span className="block text-[10px] font-mono tracking-widest text-brand-primary/70 uppercase mt-2">RESOLVED_SYS</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { title: "STRUCTURAL_VOID", label: "Pothole", score: 94, img: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&q=80", prio: "CRITICAL" },
                      { title: "VANDALISM_SURFACE", label: "Graffiti", score: 72, img: "https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=400&q=80", prio: "MODERATE" }
                    ].map((item, i) => (
                       <motion.div whileHover={{ scale: 1.01 }} key={i} className="bg-black border border-white/10 overflow-hidden cursor-pointer group">
                         <div className="h-40 w-full relative">
                            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur border border-brand-primary/50 px-2 py-1 text-[9px] font-mono tracking-widest text-brand-primary flex items-center z-10">
                              <ShieldAlert className="w-3 h-3 mr-2" /> PRF_{item.score}
                            </div>
                            <div className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-100 transition-opacity duration-500 grayscale group-hover:grayscale-0" style={{ backgroundImage: `url(${item.img})` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                         </div>
                         <div className="p-4 border-t border-white/10">
                           <div className="flex justify-between items-start mb-1">
                             <h3 className="font-bold text-white uppercase tracking-widest text-sm">{item.title}</h3>
                             <span className={cn("text-[9px] font-mono tracking-widest px-2 py-1 border", item.prio === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30')}>
                               {item.prio}
                             </span>
                           </div>
                           <p className="text-[10px] font-mono text-white/40 uppercase">{item.label} // SECTOR_7</p>
                         </div>
                       </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-[60vh] bg-black border border-white/10 relative overflow-hidden flex items-center justify-center">
                  {/* Cyberpunk Map Mock */}
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80')] bg-cover bg-center opacity-20 contrast-150 invert sepia hue-rotate-180" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                  
                  <div className="absolute top-1/4 left-1/4 animate-pulse"><MapPin className="w-6 h-6 text-brand-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.8)]" /></div>
                  <div className="absolute top-1/2 left-2/3 animate-pulse" style={{ animationDelay: '200ms' }}><MapPin className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]" /></div>
                  <div className="absolute bottom-1/3 left-1/3 animate-pulse" style={{ animationDelay: '400ms' }}><MapPin className="w-6 h-6 text-brand-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.8)]" /></div>
                  
                  <div className="z-10 bg-black/90 border border-brand-primary/50 backdrop-blur px-4 py-2 text-[10px] font-mono tracking-widest text-brand-primary uppercase">
                    [ GEO_GRID_ACTIVE ]
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* --- PROFILE TAB --- */}
          {activeTab === "PROFILE" && (
            <motion.div key="profile" variants={pageVariants} initial="initial" animate="in" exit="out" className="p-6 space-y-6">
               <div className="border border-white/10 p-8 flex flex-col items-center text-center relative overflow-hidden bg-black/50">
                  <div className="w-20 h-20 bg-black border border-white/20 flex items-center justify-center relative z-10 mb-6">
                    <div className="absolute inset-2 border border-white/10" />
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-serif font-bold text-white tracking-[0.2em] uppercase">USR_0X8F</h2>
                  <p className="text-[10px] font-mono text-brand-primary mt-2 uppercase tracking-widest">Clearance: Level 4</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="border border-white/10 p-5 bg-black/50">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/40 mb-2">REPUTATION_SCORE</p>
                    <div className="text-3xl font-serif text-white">850</div>
                 </div>
                 <div className="border border-white/10 p-5 bg-black/50">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/40 mb-2">RESOLVED_CASES</p>
                    <div className="text-3xl font-serif text-brand-primary">14</div>
                 </div>
               </div>

               <div className="border border-brand-primary/30 p-6 relative overflow-hidden bg-brand-primary/5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary mb-6 flex items-center"><Sparkles className="w-3 h-3 mr-2" /> SECTOR_HEALTH</p>
                  <div className="flex items-end space-x-2 mb-4">
                    <span className="text-6xl font-serif tracking-tighter text-white">78<span className="text-2xl text-white/40">%</span></span>
                  </div>
                  <div className="w-full h-1 bg-white/10 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-brand-primary shadow-[0_0_10px_rgba(204,255,0,0.8)]" />
                  </div>
                  <p className="text-[9px] font-mono text-white/40 mt-4 uppercase tracking-widest">Sector integrity stable. Continuous monitoring advised.</p>
               </div>
            </motion.div>
          )}

          {/* --- REPORT FLOW --- */}
          {activeTab === "REPORT" && (
            <motion.div key="report" variants={pageVariants} initial="initial" animate="in" exit="out" className="h-full flex flex-col">
              <input type="file" accept="image/*" capture="environment" className="hidden" id="cameraInput" ref={fileInputRef} onChange={(e) => handleImageCapture(e, false)} />
              <input type="file" accept="image/*" capture="environment" className="hidden" id="afterCameraInput" ref={afterFileInputRef} onChange={(e) => handleImageCapture(e, true)} />

              <AnimatePresence mode="wait">
                {flow === "START" && (
                  <motion.div key="f-start" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-sm border border-white/10 p-8 flex flex-col items-center text-center bg-black/50 backdrop-blur relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-brand-primary" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-brand-primary" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-brand-primary" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-brand-primary" />

                      <div className="w-20 h-20 border border-brand-primary/50 flex items-center justify-center mb-8 bg-brand-primary/5">
                        <Camera className="w-8 h-8 text-brand-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
                      </div>
                      <h2 className="text-xl font-serif tracking-[0.1em] text-white uppercase mb-3">Initialize Scan</h2>
                      <p className="text-white/40 text-[10px] font-mono tracking-widest uppercase mb-10">Capture visual evidence of infrastructure degradation.</p>
                      
                      <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-brand-primary text-black font-bold font-mono tracking-widest text-[11px] uppercase hover:bg-brand-secondary transition-all active:scale-95 shadow-[0_0_15px_rgba(204,255,0,0.4)]">
                        [ ENGAGE_OPTICS ]
                      </button>
                    </div>
                  </motion.div>
                )}

                {flow === "ANALYZING" && (
                  <motion.div key="f-analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <div className="absolute inset-0 border border-white/10 rounded-full" />
                      <div className="absolute inset-4 border border-brand-primary/30 rounded-full" />
                      <div className="absolute inset-8 border border-brand-primary border-t-transparent rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                      <Crosshair className="w-8 h-8 text-brand-primary animate-pulse drop-shadow-[0_0_10px_rgba(204,255,0,1)]" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-[11px] font-mono font-bold tracking-[0.2em] text-brand-primary uppercase mb-2">RUNNING_ANALYSIS_PROTOCOL</h2>
                      <p className="text-white/40 font-mono text-[9px] uppercase tracking-widest">Extracting semantic features...</p>
                    </div>
                  </motion.div>
                )}

                {flow === "CONFIRM_ISSUE" && (
                  <motion.div key="f-confirm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col p-6">
                    <div className="flex-1 flex flex-col space-y-6">
                      <div className="w-full aspect-[4/3] border border-white/10 relative overflow-hidden bg-black group">
                         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px] z-10 pointer-events-none opacity-50" />
                         {capturedImage && <img src={capturedImage} alt="Captured" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition duration-500" />}
                         
                         {detectedIssue?.confidence && detectedIssue.confidence > 0 && (
                            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur border border-brand-primary px-3 py-1.5 z-20">
                              <span className="text-[10px] font-mono tracking-widest text-brand-primary">CONFIDENCE: {detectedIssue.confidence}%</span>
                            </div>
                         )}
                      </div>

                      {detectedIssue && (
                        <div className="border border-white/10 p-6 bg-black/50">
                          <h2 className="text-2xl font-serif font-bold tracking-widest text-white uppercase mb-2">{detectedIssue.issue}</h2>
                          <p className="text-white/50 text-[10px] font-mono tracking-widest uppercase leading-relaxed">{detectedIssue.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pb-4 mt-8">
                      {detectedIssue?.confidence === 0 || detectedIssue?.issue === "No Issue Found" ? (
                         <button onClick={() => setFlow("START")} className="w-full py-4 bg-white/10 border border-white/20 text-white font-mono font-bold tracking-widest text-[11px] uppercase hover:bg-white/20 active:scale-95 transition-all">
                           [ ABORT_AND_RETRY ]
                         </button>
                      ) : (
                        <>
                          <button onClick={handleConfirmIssue} className="w-full py-4 bg-brand-primary text-black font-mono font-bold tracking-widest text-[11px] uppercase hover:bg-brand-secondary active:scale-95 transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)]">
                            [ CONFIRM_EVIDENCE ]
                          </button>
                          <button onClick={() => setFlow("START")} className="w-full py-4 border border-white/10 text-white/50 font-mono font-bold tracking-widest text-[11px] uppercase hover:bg-white/5 active:scale-95 transition-all">
                            DISCARD
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {flow === "CONFIRM_LOCATION" && (
                  <motion.div key="f-loc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col p-6">
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center">
                      <div className="relative w-32 h-32 flex items-center justify-center border border-white/10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(204,255,0,0.1),transparent)]" />
                        <Navigation className="w-8 h-8 text-brand-primary drop-shadow-[0_0_10px_rgba(204,255,0,1)]" />
                        
                        {/* Targeting reticle */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand-primary" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-brand-primary" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-brand-primary" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-brand-primary" />
                      </div>
                      
                      <div className="space-y-4 border border-white/10 p-8 w-full bg-black/50">
                        <h2 className="text-[9px] font-mono font-bold tracking-widest text-white/40 uppercase">SPATIAL_COORDINATES</h2>
                        <p className="text-white font-mono text-sm tracking-widest">{locationName}</p>
                        <p className="text-brand-primary text-[9px] font-mono uppercase tracking-widest flex items-center justify-center"><CheckCircle className="w-3 h-3 mr-2" /> GPS_LOCK_ACQUIRED</p>
                      </div>
                    </div>
                    <div className="pb-4 mt-8">
                      <button onClick={handleConfirmLocation} className="w-full py-4 bg-white text-black font-mono font-bold tracking-widest text-[11px] uppercase shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-95 transition-all">
                        [ TRANSMIT_LOCATION ]
                      </button>
                    </div>
                  </motion.div>
                )}

                {flow === "DUPLICATE_CHECK" && (
                  <motion.div key="f-dup-check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
                     <div className="grid grid-cols-4 gap-2">
                       {[1,2,3,4,5,6,7,8].map((i) => (
                         <div key={i} className="w-12 h-12 border border-white/10 bg-white/5 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
                       ))}
                     </div>
                     <div className="text-center">
                        <h2 className="text-[11px] font-mono font-bold tracking-[0.2em] text-white uppercase mb-2">QUERYING_DATABASE</h2>
                        <p className="text-brand-primary font-mono text-[9px] uppercase tracking-widest">Searching spatial index for similar logs...</p>
                     </div>
                  </motion.div>
                )}

                {flow === "DUPLICATE_FOUND" && (
                  <motion.div key="f-dup-found" initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} className="flex-1 flex flex-col p-6">
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="inline-block px-4 py-2 border border-brand-primary text-brand-primary bg-brand-primary/10 font-mono font-bold text-[9px] tracking-[0.2em] uppercase mb-8">
                        WARNING: PRE-EXISTING LOG DETECTED
                      </div>
                      
                      <h2 className="text-2xl font-serif font-bold tracking-widest text-white uppercase mb-3">{detectedIssue?.issue || "ANOMALY"}</h2>
                      <p className="text-white/50 font-mono text-[10px] tracking-widest uppercase">8 operatives have previously flagged this anomaly.</p>

                      <div className="w-full border border-white/10 p-6 mt-10 flex items-center justify-between bg-black/50">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 border border-brand-primary bg-brand-primary/10 flex items-center justify-center overflow-hidden">
                            {capturedImage && <img src={capturedImage} className="w-full h-full object-cover grayscale opacity-70" />}
                          </div>
                          <span className="text-[8px] font-mono text-brand-primary tracking-widest uppercase mt-3">INPUT_A</span>
                        </div>
                        <div className="text-white/20 text-2xl font-light font-mono">+</div>
                        <div className="flex flex-col items-center relative">
                          <div className="w-16 h-16 border border-white/20 bg-white/5 -rotate-6 absolute" />
                          <div className="w-16 h-16 border border-white/20 bg-white/5 rotate-3 absolute" />
                          <div className="w-16 h-16 border border-white/30 bg-black flex items-center justify-center z-10 relative">
                             <ImageIcon className="w-5 h-5 text-white/30" />
                          </div>
                          <span className="text-[8px] font-mono text-white/40 tracking-widest uppercase mt-3">ARCHIVE</span>
                        </div>
                      </div>

                      <div className="text-[9px] font-mono font-bold tracking-[0.2em] text-white/40 uppercase mt-10 border border-white/10 px-4 py-2 bg-white/5">
                        [ MERGING_DATASETS ]
                      </div>
                    </div>

                    <div className="pb-4 mt-8">
                      <button onClick={handleJoinIssue} className="w-full py-4 bg-brand-primary text-black font-mono font-bold tracking-widest text-[11px] uppercase shadow-[0_0_15px_rgba(204,255,0,0.3)] flex items-center justify-center space-x-3 active:scale-95 transition-all">
                        <span>APPEND EVIDENCE</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {flow === "ISSUE_VIEW" && (
                  <motion.div key="f-issue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col p-6">
                    
                    <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                      <div className="flex items-center space-x-2 border border-red-500/30 text-red-400 px-3 py-1.5 bg-red-500/10">
                        <div className="w-1.5 h-1.5 bg-red-500 animate-pulse" />
                        <span className="text-[9px] font-mono tracking-widest uppercase">STATUS: OPEN</span>
                      </div>
                      <span className="text-[9px] font-mono text-white/30 tracking-widest">REF: #8492</span>
                    </div>

                    <h1 className="text-2xl font-serif font-bold tracking-[0.1em] text-white uppercase mb-8">{detectedIssue?.issue || "REPORTED ANOMALY"}</h1>

                    {/* Proof Score */}
                    <div className="border border-white/10 p-6 bg-black/50 mb-6 relative">
                       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ShieldAlert className="w-20 h-20" /></div>
                       <p className="text-[9px] font-mono text-brand-primary tracking-widest uppercase mb-4 flex items-center"><ShieldAlert className="w-3 h-3 mr-2"/> PROOF_SCORE</p>
                       <div className="flex items-end space-x-2 mb-4">
                         <span className="text-6xl font-serif font-bold text-white leading-none tracking-tighter">94</span>
                         <span className="text-sm font-mono text-white/40 tracking-widest mb-1">/ 100</span>
                       </div>
                       <div className="w-full h-1 bg-white/10 mb-6">
                         <div className="h-full bg-brand-primary w-[94%] shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
                       </div>
                       
                       <p className="text-[8px] font-mono text-white/40 tracking-widest uppercase mb-4">EVIDENCE_LOG</p>
                       <ul className="space-y-3">
                         {["8 independent captures", "Verified GPS cluster", "Reported over 4 days", "5 community verifications"].map((item, i) => (
                           <li key={i} className="flex items-center space-x-3 text-[10px] font-mono text-white/70 uppercase tracking-wide">
                             <div className="w-4 h-4 border border-brand-primary/50 flex items-center justify-center bg-brand-primary/10">
                               <CheckCircle className="w-2 h-2 text-brand-primary" />
                             </div>
                             <span>{item}</span>
                           </li>
                         ))}
                       </ul>
                    </div>

                    {/* Priority Score */}
                    <div className="border border-orange-500/30 p-6 bg-orange-500/5 mb-6">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <p className="text-[9px] font-mono text-orange-500/70 tracking-widest uppercase mb-1">IMPACT_ANALYSIS</p>
                           <h3 className="text-sm font-bold tracking-widest text-orange-400 uppercase">PRIORITY: CRITICAL</h3>
                         </div>
                         <span className="text-2xl font-serif font-bold text-orange-500">91</span>
                       </div>
                       <div className="flex flex-wrap gap-2 mt-4">
                          <span className="px-2 py-1 border border-orange-500/20 bg-orange-500/10 text-[9px] font-mono tracking-widest text-orange-300 uppercase">Hazard: Cyclists</span>
                          <span className="px-2 py-1 border border-orange-500/20 bg-orange-500/10 text-[9px] font-mono tracking-widest text-orange-300 uppercase">Accessibility</span>
                       </div>
                    </div>

                    <div className="mt-auto pt-4 pb-4 space-y-4">
                      <button className="w-full py-4 border border-white/20 bg-transparent text-white font-mono font-bold tracking-widest text-[11px] uppercase flex items-center justify-center space-x-3 hover:bg-white/5 transition-all">
                        <ThumbsUp className="w-4 h-4" /> <span>VOUCH_FOR_ISSUE</span>
                      </button>
                      <button onClick={() => afterFileInputRef.current?.click()} className="w-full py-4 border border-brand-primary bg-brand-primary/10 text-brand-primary font-mono font-bold tracking-[0.1em] text-[11px] uppercase hover:bg-brand-primary/20 transition-all shadow-[0_0_15px_rgba(204,255,0,0.1)]">
                        [ MARK_RESOLVED ]
                      </button>
                    </div>
                  </motion.div>
                )}

                {flow === "VERIFYING_FIX" && (
                   <motion.div key="f-verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
                     <div className="flex items-center justify-center space-x-4">
                        <div className="w-24 h-24 border border-white/20 bg-black flex items-center justify-center relative overflow-hidden grayscale opacity-50">
                           <div className="absolute top-0 left-0 bg-white/20 backdrop-blur px-2 py-1 text-[8px] font-mono text-white tracking-widest z-10">T-MINUS_1</div>
                           {capturedImage ? <img src={capturedImage} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-white/30" />}
                        </div>
                        <div className="w-8 h-8 border border-brand-primary flex items-center justify-center bg-brand-primary/10 z-20 relative">
                           <ArrowRight className="w-4 h-4 text-brand-primary" />
                        </div>
                        <div className="w-24 h-24 border border-brand-primary bg-black flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(204,255,0,0.2)]">
                           <div className="absolute top-0 left-0 bg-brand-primary px-2 py-1 text-[8px] font-mono text-black tracking-widest z-10 font-bold">T-ZERO</div>
                           {afterImage ? <img src={afterImage} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-brand-primary" />}
                        </div>
                     </div>
                     <div className="text-center">
                       <h2 className="text-[11px] font-mono font-bold tracking-[0.2em] text-brand-primary uppercase mb-2 animate-pulse">VERIFYING_REPAIR_DELTA</h2>
                       <p className="text-white/40 font-mono text-[9px] uppercase tracking-widest">Cross-referencing evidence matrices</p>
                     </div>
                   </motion.div>
                )}

                {flow === "FIX_CONFIRMED" && (
                   <motion.div key="f-fix" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col p-6">
                     <div className="flex-1 flex flex-col items-center justify-center text-center">
                       <div className="w-24 h-24 border border-brand-primary flex items-center justify-center mb-10 relative bg-brand-primary/10">
                         <div className="absolute inset-[-10px] border border-brand-primary/30 opacity-50 animate-ping" />
                         <CheckCircle className="w-10 h-10 text-brand-primary relative z-10 drop-shadow-[0_0_10px_rgba(204,255,0,1)]" />
                       </div>
                       
                       <h2 className="text-3xl font-serif font-bold tracking-[0.2em] text-white uppercase">SYS_RESOLVED</h2>
                       <p className="text-brand-primary font-mono text-[10px] tracking-widest mt-4 uppercase">Fix confirmed by neural analysis.</p>
                       
                       <div className="w-full p-6 border border-white/10 bg-black/50 mt-10 relative overflow-hidden">
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary" />
                         <p className="text-[9px] font-mono font-bold text-white/50 tracking-widest uppercase mb-3 flex justify-between">
                            <span>Delta_Similarity</span>
                            <span className="text-brand-primary">91%</span>
                         </p>
                         <div className="w-full h-[2px] bg-white/10 mb-5"><div className="w-[91%] h-full bg-brand-primary shadow-[0_0_5px_rgba(204,255,0,0.8)]"/></div>
                         <p className="text-[9px] font-mono text-white/40 tracking-widest uppercase text-left">Awaiting 3 community confirmations to seal archive.</p>
                       </div>
                     </div>

                     <div className="pb-4 mt-8">
                       <button onClick={() => { setFlow("START"); setActiveTab("FEED"); }} className="w-full py-4 border border-white/20 text-white font-mono font-bold tracking-widest text-[11px] uppercase hover:bg-white/5 active:scale-95 transition-all">
                         [ RETURN_TO_GRID ]
                       </button>
                     </div>
                   </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <nav className="border-t border-white/10 px-6 py-4 flex justify-between items-center relative z-20 pb-safe bg-black/90 backdrop-blur-md">
         <button onClick={() => setActiveTab("FEED")} className={cn("flex flex-col items-center space-y-2 transition-all duration-300", activeTab === "FEED" ? "text-brand-primary" : "text-white/40 hover:text-white/60")}>
           <HomeIcon className="w-5 h-5" />
           <span className="text-[8px] font-mono tracking-widest uppercase">Grid</span>
         </button>
         
         <div className="-mt-12 relative">
           <div className="absolute inset-0 bg-brand-primary blur-xl opacity-20" />
           <button 
             onClick={startReport} 
             className="relative w-16 h-16 border border-brand-primary bg-black flex items-center justify-center transform transition-all active:scale-95 group"
           >
             <div className="absolute inset-1 border border-brand-primary/30 group-hover:border-brand-primary transition-colors" />
             <Camera className="w-6 h-6 text-brand-primary group-hover:drop-shadow-[0_0_8px_rgba(204,255,0,1)] transition-all" />
           </button>
         </div>

         <button onClick={() => setActiveTab("PROFILE")} className={cn("flex flex-col items-center space-y-2 transition-all duration-300", activeTab === "PROFILE" ? "text-brand-primary" : "text-white/40 hover:text-white/60")}>
           <UserIcon className="w-5 h-5" />
           <span className="text-[8px] font-mono tracking-widest uppercase">Agent</span>
         </button>
      </nav>

    </main>
  );
}
