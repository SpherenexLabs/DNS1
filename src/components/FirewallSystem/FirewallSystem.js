




// import React, { useState, useEffect } from 'react';
// import './FirewallSystem.css';
// import AIOptimizationPopup from './AIOptimizationPopup';
// import { generateDeviceInfo, generateTimestamp } from '../../utils/firewall-utils';

// // 🔥 Firebase
// import { db } from '../../firebase';
// import { ref, update, serverTimestamp } from 'firebase/database';

// const FirewallSystem = ({ threatData, active, onAllFirewallsBreached }) => {
//   const [firewalls, setFirewalls] = useState([
//     { id: 1, name: 'Perimeter Firewall', progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//     { id: 2, name: 'Network Firewall', progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//     { id: 3, name: 'Application Firewall', progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//     { id: 4, name: 'Data Firewall', progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null }
//   ]);
  
//   const [currentFirewallIndex, setCurrentFirewallIndex] = useState(0);
//   const [showOptimization, setShowOptimization] = useState(false);
//   const [threatInfo, setThreatInfo] = useState(null);
//   const [breachStartTime, setBreachStartTime] = useState(null);
//   const [optimizationCompleted, setOptimizationCompleted] = useState(false);
//   const [postOptimizationPhase, setPostOptimizationPhase] = useState(false);

//   // ✅ NEW: store how many breached before optimization
//   const [preOptimizationBreachedCount, setPreOptimizationBreachedCount] = useState(0);

//   const areAllThreatsOfLevel = (level) => {
//     return threatData && 
//            threatData.types && 
//            threatData.types.length > 0 && 
//            threatData.types.every(t => t.level.toLowerCase() === level.toLowerCase());
//   };
  
//   useEffect(() => {
//     if (threatData) {
//       setFirewalls([
//         { id: 1, name: 'Perimeter Firewall', progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//         { id: 2, name: 'Network Firewall', progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//         { id: 3, name: 'Application Firewall', progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//         { id: 4, name: 'Data Firewall', progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null }
//       ]);
//       setCurrentFirewallIndex(0);
//       setBreachStartTime(null);
//       setOptimizationCompleted(false);
//       setPostOptimizationPhase(false);
//       setShowOptimization(false);
//       setThreatInfo(null);
//       setPreOptimizationBreachedCount(0);
//     }
//   }, [threatData]);
  
//   useEffect(() => {
//     if (active && threatData && !breachStartTime) {
//       setBreachStartTime(Date.now());
//       setFirewalls(prev => {
//         const newFirewalls = [...prev];
//         newFirewalls[0] = { ...newFirewalls[0], startTime: Date.now() };
//         return newFirewalls;
//       });
//     }
//   }, [active, threatData, breachStartTime]);
  
//   const calculateAttackStrength = () => {
//     if (!threatData || !threatData.types) return 0;
//     if (postOptimizationPhase) {
//       if (currentFirewallIndex === 2) return 0.4;
//       else if (currentFirewallIndex === 3) return 0.1;
//     }
//     if (areAllThreatsOfLevel('Advisory')) return 0.05;
//     if (areAllThreatsOfLevel('Critical')) return 1.0;
//     const levelScores = { 'Advisory': 1, 'Warning': 2.5, 'Critical': 4 };
//     let totalScore = 0;
//     threatData.types.forEach(t => totalScore += levelScores[t.level] || 0);
//     return (totalScore / (threatData.types.length * 4)) * 0.7;
//   };
  
//   useEffect(() => {
//     if (!active || !threatData || showOptimization) return;
    
//     const attackStrength = calculateAttackStrength();
//     const interval = setInterval(() => {
//       setFirewalls(prev => {
//         const currentIdx = currentFirewallIndex;
//         if (currentIdx >= prev.length) {
//           clearInterval(interval);
//           return prev;
//         }
//         const newFirewalls = [...prev];
//         let firewallResistance = 1;
//         if (currentIdx === 3) firewallResistance = 3;
//         else if (currentIdx === 2) firewallResistance = 1.5;
//         const incrementAmount = Math.max(0.2, (attackStrength * 2) / firewallResistance);
//         if (newFirewalls[currentIdx].startTime === null) {
//           newFirewalls[currentIdx] = { ...newFirewalls[currentIdx], startTime: Date.now() };
//         }
//         newFirewalls[currentIdx] = {
//           ...newFirewalls[currentIdx],
//           progress: Math.min(100, newFirewalls[currentIdx].progress + incrementAmount),
//           status: 'Under Attack'
//         };
//         if (newFirewalls[currentIdx].progress >= 100 && !newFirewalls[currentIdx].breached) {
//           const breachDuration = Math.round((Date.now() - newFirewalls[currentIdx].startTime) / 1000);
//           newFirewalls[currentIdx] = {
//             ...newFirewalls[currentIdx],
//             breached: true,
//             status: 'BREACHED',
//             breachTime: breachDuration
//           };
          
//           // ✅ When the 2nd firewall breaches → show optimization
//           if (currentIdx === 1) {
//             if (!areAllThreatsOfLevel('Critical')) {
//               clearInterval(interval);
//               newFirewalls[currentIdx].status = 'Firewall breached';
//               setShowOptimization(true);

//               // ✅ Count how many breached before optimization
//               const count = newFirewalls.filter(fw => fw.breached).length;
//               setPreOptimizationBreachedCount(count);

//               // ✅ Save into Firebase
//               if (threatData?.threatKey) {
//                 update(ref(db, `incomingThreats/${threatData.threatKey}`), {
//                   preOptimizationBreachedCount: count,
//                   preOptLoggedAt: serverTimestamp()
//                 }).catch(e => console.error("Failed to save preOptimizationBreachedCount:", e));
//               }
//             } else {
//               setCurrentFirewallIndex(currentIdx + 1);
//             }
//           } 
//           else if (currentIdx < prev.length - 1) {
//             setCurrentFirewallIndex(currentIdx + 1);
//           } 
//           else if (currentIdx === prev.length - 1) {
//             clearInterval(interval);
//             const firewallBreachTimes = newFirewalls.map(fw => ({ name: fw.name, timeToBreak: fw.breachTime || 0 }));
//             const fullThreatInfo = {
//               ip: threatData.ip,
//               location: getRandomLocation(),
//               deviceInfo: generateDeviceInfo(),
//               timeStamp: generateTimestamp(),
//               types: threatData.types,
//               firewallBreachTimes,
//               totalBreachTime: Math.round((Date.now() - breachStartTime) / 1000)
//             };
//             setThreatInfo(fullThreatInfo);
//             if (onAllFirewallsBreached) onAllFirewallsBreached(fullThreatInfo);
//           }
//         }
//         return newFirewalls;
//       });
//     }, 100);
    
//     return () => clearInterval(interval);
//   }, [active, threatData, currentFirewallIndex, onAllFirewallsBreached, breachStartTime, showOptimization, postOptimizationPhase]);
  
//   const handleOptimizationComplete = () => {
//     setShowOptimization(false);
//     setOptimizationCompleted(true);
//     setPostOptimizationPhase(true);
//     setCurrentFirewallIndex(2);
//   };
  
//   const getRandomLocation = () => {
//     const locations = ['New York, USA','Beijing, China','Moscow, Russia','London, UK','Sydney, Australia','Tokyo, Japan','Berlin, Germany','Rio de Janeiro, Brazil'];
//     return locations[Math.floor(Math.random() * locations.length)];
//   };
  
//   return (
//     <div className={`firewall-system ${active ? 'active' : 'inactive'}`}>
//       <div className="system-header">
//         <h2>Firewall Defense System</h2>
//         <div className={`system-status ${
//           firewalls.every(fw => !fw.breached) ? 'secure' :
//           firewalls.every(fw => fw.breached) ? 'compromised' : 'warning'
//         }`}>
//           {firewalls.every(fw => !fw.breached) ? 'Fully Protected' :
//            firewalls.every(fw => fw.breached) ? 'SYSTEM COMPROMISED' : 'Partial Breach'}
//         </div>
//       </div>
      
//       <div className="firewalls-container">
//         {firewalls.map((fw) => (
//           <div key={fw.id} className={`firewall-unit ${fw.breached ? 'breached' : fw.progress > 0 ? 'under-attack' : ''}`}>
//             <div className="firewall-header">
//               <h3>{fw.name}</h3>
//               <div className={`status-indicator ${fw.breached ? 'breached' : fw.progress > 0 ? 'warning' : 'secure'}`}>
//                 {fw.status}
//               </div>
//             </div>
//             <div className="progress-container">
//               <div className="progress-bar">
//                 <div className="progress-fill" style={{ width: `${fw.progress}%` }} />
//               </div>
//               <div className="progress-text">
//                 {fw.breached ? "Breach Completed" : `${Math.round(fw.progress)}% Compromised`}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
      
//       {threatInfo && firewalls.every(fw => fw.breached) && (
//         <div className="breach-summary">
//           <h3><i className="fas fa-exclamation-triangle"></i> Security Breach Detected</h3>
//           <div className="breach-details">
//             <div className="detail-row"><span className="detail-label">Source IP:</span><span className="detail-value">{threatInfo.ip}</span></div>
//             <div className="detail-row"><span className="detail-label">Location:</span><span className="detail-value">{threatInfo.location}</span></div>
//             <div className="detail-row"><span className="detail-label">Device:</span><span className="detail-value">{threatInfo.deviceInfo}</span></div>
//             <div className="detail-row"><span className="detail-label">Timestamp:</span><span className="detail-value">{threatInfo.timeStamp}</span></div>
//             <div className="detail-row"><span className="detail-label">Total Breach Time:</span><span className="detail-value">{threatInfo.totalBreachTime} seconds</span></div>
//             <div className="detail-row"><span className="detail-label">Threat Types:</span>
//               <div className="detail-value threat-types">
//                 {threatInfo.types.map((type, idx) => (
//                   <span key={idx} className={`threat-badge ${type.level}`}>{type.type === 'TCPIP' ? 'TCP/IP' : type.type}<small>({type.level})</small></span>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
      
//       {showOptimization && (
//         <AIOptimizationPopup onComplete={handleOptimizationComplete} />
//       )}
//     </div>
//   );
// };

// export default FirewallSystem;





// import React, { useState, useEffect, useRef } from 'react';
// import './FirewallSystem.css';
// import AIOptimizationPopup from './AIOptimizationPopup';
// import { generateDeviceInfo, generateTimestamp } from '../../utils/firewall-utils';

// // 🔥 Firebase
// import { db } from '../../firebase';
// import { ref, update, serverTimestamp, get, child } from 'firebase/database';

// const FirewallSystem = ({ threatData, active, onAllFirewallsBreached }) => {
//   const [firewalls, setFirewalls] = useState([
//     { id: 1, name: 'Perimeter Firewall',   progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//     { id: 2, name: 'Network Firewall',     progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//     { id: 3, name: 'Application Firewall', progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//     { id: 4, name: 'Data Firewall',        progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null }
//   ]);

//   const [currentFirewallIndex, setCurrentFirewallIndex] = useState(0);
//   const [showOptimization, setShowOptimization] = useState(false);
//   const [threatInfo, setThreatInfo] = useState(null);
//   const [breachStartTime, setBreachStartTime] = useState(null);
//   const [optimizationCompleted, setOptimizationCompleted] = useState(false);
//   const [postOptimizationPhase, setPostOptimizationPhase] = useState(false);

//   // how many breached before optimization opens
//   const [preOptimizationBreachedCount, setPreOptimizationBreachedCount] = useState(0);
//   const savedPreOptRef = useRef(false); // ensure we write only once

//   // ---- helpers --------------------------------------------------------------

//   const normalizeLevel = (lvl) => {
//     if (!lvl) return '';
//     const s = String(lvl).toLowerCase();
//     if (s === 'critical') return 'Critical';
//     if (s === 'warning') return 'Warning';
//     if (s === 'advisory') return 'Advisory';
//     return lvl;
//   };

//   const areAllThreatsOfLevel = (level) => {
//     const target = String(level).toLowerCase();
//     return (
//       threatData &&
//       Array.isArray(threatData.types) &&
//       threatData.types.length > 0 &&
//       threatData.types.every(t => String(t.level).toLowerCase() === target)
//     );
//   };

//   // Try writing to a list of candidate paths, in order, until one succeeds
//   const writePreOptCount = async (count) => {
//     if (!threatData) return;

//     // construct candidate paths based on what we might have
//     const threatKey = threatData.threatKey || threatData.inboxKey || null;
//     const fromUid   = threatData.fromUid || null;
//     const sourceKey = threatData.sourceKey || null;

//     const candidates = [];

//     // 1) receiver’s global inbox path (preferred)
//     if (threatKey) {
//       candidates.push(`incomingThreats/${threatKey}`);
//     }
//     // 2) sender’s per-user path if we know who & which
//     if (fromUid && sourceKey) {
//       candidates.push(`users/${fromUid}/threats/${sourceKey}`);
//     }
//     // 3) fallback: maybe threatKey is also the per-user key
//     if (fromUid && threatKey) {
//       candidates.push(`users/${fromUid}/threats/${threatKey}`);
//     }

//     if (candidates.length === 0) {
//       console.warn('[FirewallSystem] No candidate Firebase path to write preOptimizationBreachedCount.');
//       return;
//     }

//     // try each candidate, stop at first success
//     for (const path of candidates) {
//       try {
//         // optional existence check to avoid noisy writes
//         const snap = await get(child(ref(db), path));
//         if (!snap.exists()) {
//           console.warn(`[FirewallSystem] Path does not exist yet, skipping: ${path}`);
//           continue;
//         }

//         await update(ref(db, path), {
//           preOptimizationBreachedCount: count,
//           preOptLoggedAt: serverTimestamp()
//         });

//         console.log(`[FirewallSystem] Saved preOptimizationBreachedCount=${count} to ${path}`);
//         return; // success → stop trying
//       } catch (e) {
//         console.error(`[FirewallSystem] Failed writing to ${path}:`, e?.message || e);
//         // try next candidate
//       }
//     }

//     console.error('[FirewallSystem] Could not save preOptimizationBreachedCount to any candidate path.');
//   };

//   const calculateAttackStrength = () => {
//     if (!threatData || !Array.isArray(threatData.types)) return 0;

//     // Normalize levels for consistent logic
//     const normalized = threatData.types.map(t => ({ ...t, level: normalizeLevel(t.level) }));

//     if (postOptimizationPhase) {
//       if (currentFirewallIndex === 2) return 0.4; // moderate for 3rd
//       if (currentFirewallIndex === 3) return 0.1; // minimum for 4th
//     }

//     if (normalized.every(t => t.level === 'Advisory')) return 0.05;
//     if (normalized.every(t => t.level === 'Critical')) return 1.0;

//     const levelScores = { 'Advisory': 1, 'Warning': 2.5, 'Critical': 4 };
//     const total = normalized.reduce((sum, t) => sum + (levelScores[t.level] || 0), 0);
//     return (total / (normalized.length * 4)) * 0.7; // mixed → moderate
//   };

//   const getRandomLocation = () => {
//     const locations = [
//       'New York, USA','Beijing, China','Moscow, Russia','London, UK',
//       'Sydney, Australia','Tokyo, Japan','Berlin, Germany','Rio de Janeiro, Brazil'
//     ];
//     return locations[Math.floor(Math.random() * locations.length)];
//   };

//   // ---- lifecycle ------------------------------------------------------------

//   // Reset when a new threat arrives
//   useEffect(() => {
//     if (threatData) {
//       setFirewalls([
//         { id: 1, name: 'Perimeter Firewall',   progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//         { id: 2, name: 'Network Firewall',     progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//         { id: 3, name: 'Application Firewall', progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null },
//         { id: 4, name: 'Data Firewall',        progress: 0, breached: false, status: 'Secure', startTime: null, breachTime: null }
//       ]);
//       setCurrentFirewallIndex(0);
//       setBreachStartTime(null);
//       setOptimizationCompleted(false);
//       setPostOptimizationPhase(false);
//       setShowOptimization(false);
//       setThreatInfo(null);
//       setPreOptimizationBreachedCount(0);
//       savedPreOptRef.current = false; // allow saving for this threat
//     }
//   }, [threatData]);

//   // Mark the start time when the attack begins
//   useEffect(() => {
//     if (active && threatData && !breachStartTime) {
//       const now = Date.now();
//       setBreachStartTime(now);
//       setFirewalls(prev => {
//         const cp = [...prev];
//         cp[0] = { ...cp[0], startTime: now };
//         return cp;
//       });
//     }
//   }, [active, threatData, breachStartTime]);

//   // Breach progression loop
//   useEffect(() => {
//     if (!active || !threatData || showOptimization) return;

//     const attackStrength = calculateAttackStrength();

//     const interval = setInterval(() => {
//       setFirewalls(prev => {
//         const idx = currentFirewallIndex;
//         if (idx >= prev.length) {
//           clearInterval(interval);
//           return prev;
//         }

//         const cp = [...prev];

//         // Resistance per layer
//         let resistance = 1;
//         if (idx === 3) resistance = 3;     // Data hardest
//         else if (idx === 2) resistance = 1.5;

//         const increment = Math.max(0.2, (attackStrength * 2) / resistance);

//         if (cp[idx].startTime === null) {
//           cp[idx] = { ...cp[idx], startTime: Date.now() };
//         }

//         cp[idx] = {
//           ...cp[idx],
//           progress: Math.min(100, cp[idx].progress + increment),
//           status: 'Under Attack'
//         };

//         // breached?
//         if (cp[idx].progress >= 100 && !cp[idx].breached) {
//           const duration = Math.round((Date.now() - cp[idx].startTime) / 1000);
//           cp[idx] = { ...cp[idx], breached: true, status: 'BREACHED', breachTime: duration };

//           // After 2nd firewall breach → show optimization (unless all Critical)
//           if (idx === 1) {
//             const normalizedAllCritical = Array.isArray(threatData.types) &&
//               threatData.types.length > 0 &&
//               threatData.types.every(t => String(t.level).toLowerCase() === 'critical');

//             if (!normalizedAllCritical) {
//               clearInterval(interval);
//               cp[idx].status = 'Firewall breached';
//               setShowOptimization(true);

//               const count = cp.filter(fw => fw.breached).length;
//               setPreOptimizationBreachedCount(count);

//               // WRITE ONCE
//               if (!savedPreOptRef.current) {
//                 savedPreOptRef.current = true;
//                 writePreOptCount(count);
//               }
//             } else {
//               setCurrentFirewallIndex(idx + 1);
//             }
//           }
//           // move to next
//           else if (idx < prev.length - 1) {
//             setCurrentFirewallIndex(idx + 1);
//           }
//           // last one breached → finish
//           else if (idx === prev.length - 1) {
//             clearInterval(interval);

//             const firewallBreachTimes = cp.map(fw => ({
//               name: fw.name,
//               timeToBreak: fw.breachTime || 0
//             }));

//             const fullThreatInfo = {
//               ip: threatData.ip,
//               location: getRandomLocation(),
//               deviceInfo: generateDeviceInfo(),
//               timeStamp: generateTimestamp(),
//               types: threatData.types,
//               firewallBreachTimes,
//               totalBreachTime: breachStartTime ? Math.round((Date.now() - breachStartTime) / 1000) : 0
//             };

//             setThreatInfo(fullThreatInfo);
//             onAllFirewallsBreached?.(fullThreatInfo);
//           }
//         }

//         return cp;
//       });
//     }, 100);

//     return () => clearInterval(interval);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [active, threatData, currentFirewallIndex, breachStartTime, showOptimization, postOptimizationPhase]);

//   // When optimization completes, continue with adjusted speeds
//   const handleOptimizationComplete = () => {
//     setShowOptimization(false);
//     setOptimizationCompleted(true);
//     setPostOptimizationPhase(true);
//     setCurrentFirewallIndex(2); // continue at 3rd firewall
//   };

//   // ---- UI -------------------------------------------------------------------

//   return (
//     <div className={`firewall-system ${active ? 'active' : 'inactive'}`}>
//       <div className="system-header">
//         <h2>Firewall Defense System</h2>
//         <div
//           className={`system-status ${
//             firewalls.every(fw => !fw.breached) ? 'secure' :
//             firewalls.every(fw => fw.breached) ? 'compromised' : 'warning'
//           }`}
//         >
//           {firewalls.every(fw => !fw.breached) ? 'Fully Protected' :
//            firewalls.every(fw => fw.breached) ? 'SYSTEM COMPROMISED' : 'Partial Breach'}
//         </div>
//       </div>

//       <div className="firewalls-container">
//         {firewalls.map((fw) => (
//           <div
//             key={fw.id}
//             className={`firewall-unit ${fw.breached ? 'breached' : fw.progress > 0 ? 'under-attack' : ''}`}
//           >
//             <div className="firewall-header">
//               <h3>{fw.name}</h3>
//               <div
//                 className={`status-indicator ${
//                   fw.breached ? 'breached' : fw.progress > 0 ? 'warning' : 'secure'
//                 }`}
//               >
//                 {fw.status}
//               </div>
//             </div>

//             <div className="progress-container">
//               <div className="progress-bar">
//                 <div className="progress-fill" style={{ width: `${fw.progress}%` }} />
//               </div>
//               <div className="progress-text">
//                 {fw.breached ? 'Breach Completed' : `${Math.round(fw.progress)}% Compromised`}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {threatInfo && firewalls.every(fw => fw.breached) && (
//         <div className="breach-summary">
//           <h3><i className="fas fa-exclamation-triangle"></i> Security Breach Detected</h3>
//           <div className="breach-details">
//             <div className="detail-row"><span className="detail-label">Source IP:</span><span className="detail-value">{threatInfo.ip}</span></div>
//             <div className="detail-row"><span className="detail-label">Location:</span><span className="detail-value">{threatInfo.location}</span></div>
//             <div className="detail-row"><span className="detail-label">Device:</span><span className="detail-value">{threatInfo.deviceInfo}</span></div>
//             <div className="detail-row"><span className="detail-label">Timestamp:</span><span className="detail-value">{threatInfo.timeStamp}</span></div>
//             <div className="detail-row"><span className="detail-label">Total Breach Time:</span><span className="detail-value">{fullThreatInfo?.totalBreachTime} seconds</span></div>
//             <div className="detail-row">
//               <span className="detail-label">Threat Types:</span>
//               <div className="detail-value threat-types">
//                 {(threatInfo.types || []).map((type, idx) => (
//                   <span key={idx} className={`threat-badge ${normalizeLevel(type.level)}`}>
//                     {type.type === 'TCPIP' ? 'TCP/IP' : type.type}
//                     <small>({normalizeLevel(type.level)})</small>
//                   </span>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {showOptimization && (
//         <AIOptimizationPopup onComplete={handleOptimizationComplete} />
//       )}
//     </div>
//   );
// };

// export default FirewallSystem;



// src/components/FirewallSystem/FirewallSystem.js
import React, { useEffect, useRef, useState } from "react";
import "./FirewallSystem.css";
import AIOptimizationPopup from "./AIOptimizationPopup";
import { generateDeviceInfo, generateTimestamp } from "../../utils/firewall-utils";

// Firebase (receiver)
import { db } from "../../firebase";
import { ref, update, serverTimestamp } from "firebase/database";

const TOTAL_FIREWALLS = 4;

/**
 * Props:
 * - threatData: { ip, types:[{type, level}], threatKey, fromUid?, sourceKey?, sentAt? }
 * - active: boolean
 * - onAllFirewallsBreached?: (fullInfo) => void
 * - onBreachedCountChange?: (count) => void
 */
const FirewallSystem = ({
  threatData,
  active,
  onAllFirewallsBreached,
  onBreachedCountChange,
}) => {
  const [firewalls, setFirewalls] = useState([
    { id: 1, name: "Perimeter Firewall",   progress: 0, breached: false, status: "Secure", startTime: null, breachTime: null },
    { id: 2, name: "Network Firewall",     progress: 0, breached: false, status: "Secure", startTime: null, breachTime: null },
    { id: 3, name: "Application Firewall", progress: 0, breached: false, status: "Secure", startTime: null, breachTime: null },
    { id: 4, name: "Data Firewall",        progress: 0, breached: false, status: "Secure", startTime: null, breachTime: null },
  ]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showOptimization, setShowOptimization] = useState(false);
  const [postOptimizationPhase, setPostOptimizationPhase] = useState(false);

  const [breachStartTime, setBreachStartTime] = useState(null);
  const [threatInfo, setThreatInfo] = useState(null);

  const [preOptimizationBreachedCount, setPreOptimizationBreachedCount] = useState(0);
  const wrotePreOptRef = useRef(false); // ensure we only write preOptimizationBreachedCount once
  const lastPushedBreachedCount = useRef(-1); // to avoid spam updates

  // ---------- helpers --------------------------------------------------------

  const normLevel = (lvl) => String(lvl || "").toLowerCase();
  const allOfLevel = (level) =>
    Array.isArray(threatData?.types) &&
    threatData.types.length > 0 &&
    threatData.types.every((t) => normLevel(t.level) === normLevel(level));

  const attackStrength = () => {
    if (!Array.isArray(threatData?.types)) return 0;

    if (postOptimizationPhase) {
      // slower after optimization
      if (currentIdx === 2) return 0.4;
      if (currentIdx === 3) return 0.1;
    }

    if (allOfLevel("Advisory")) return 0.05;
    if (allOfLevel("Critical")) return 1.0;

    const scores = { advisory: 1, warning: 2.5, critical: 4 };
    const sum =
      threatData.types.reduce((s, t) => s + (scores[normLevel(t.level)] || 0), 0) || 0;
    return (sum / (threatData.types.length * 4)) * 0.7; // mixed → moderate
  };

  const writeBreachedCount = (count) => {
    if (!threatData?.threatKey) return;
    if (count === lastPushedBreachedCount.current) return;
    lastPushedBreachedCount.current = count;

    update(ref(db, `incomingThreats/${threatData.threatKey}`), {
      breachedCount: count,
      breachedUpdatedAt: serverTimestamp(),
    }).catch((e) => console.error("breachedCount update failed:", e));
  };

  const writePreOptimizationCount = (count) => {
    if (wrotePreOptRef.current) return;
    wrotePreOptRef.current = true;
    if (!threatData?.threatKey) return;

    update(ref(db, `incomingThreats/${threatData.threatKey}`), {
      preOptimizationBreachedCount: count,
      preOptLoggedAt: serverTimestamp(),
    }).catch((e) => console.error("preOptimizationBreachedCount write failed:", e));
  };

  const getRandomLocation = () => {
    const locations = [
      "New York, USA", "Beijing, China", "Moscow, Russia", "London, UK",
      "Sydney, Australia", "Tokyo, Japan", "Berlin, Germany", "Rio de Janeiro, Brazil",
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  // ---------- resets on new threat ------------------------------------------

  useEffect(() => {
    if (!threatData) return;

    setFirewalls([
      { id: 1, name: "Perimeter Firewall",   progress: 0, breached: false, status: "Secure", startTime: null, breachTime: null },
      { id: 2, name: "Network Firewall",     progress: 0, breached: false, status: "Secure", startTime: null, breachTime: null },
      { id: 3, name: "Application Firewall", progress: 0, breached: false, status: "Secure", startTime: null, breachTime: null },
      { id: 4, name: "Data Firewall",        progress: 0, breached: false, status: "Secure", startTime: null, breachTime: null },
    ]);
    setCurrentIdx(0);
    setShowOptimization(false);
    setPostOptimizationPhase(false);
    setBreachStartTime(null);
    setThreatInfo(null);
    setPreOptimizationBreachedCount(0);
    wrotePreOptRef.current = false;
    lastPushedBreachedCount.current = -1;
    onBreachedCountChange?.(0);
    writeBreachedCount(0);
  }, [threatData]); // eslint-disable-line react-hooks/exhaustive-deps

  // mark start time when first becomes active
  useEffect(() => {
    if (active && threatData && !breachStartTime) {
      const now = Date.now();
      setBreachStartTime(now);
      setFirewalls((prev) => {
        const cp = [...prev];
        cp[0] = { ...cp[0], startTime: now };
        return cp;
      });
    }
  }, [active, threatData, breachStartTime]);

  // ---------- main loop ------------------------------------------------------

  useEffect(() => {
    if (!active || !threatData || showOptimization) return;

    const strength = attackStrength();
    const id = setInterval(() => {
      setFirewalls((prev) => {
        const idx = currentIdx;
        if (idx >= prev.length) {
          clearInterval(id);
          return prev;
        }

        const next = [...prev];

        // resistance per layer
        let resistance = 1;
        if (idx === 3) resistance = 3;      // Data hardest
        else if (idx === 2) resistance = 1.5;

        const inc = Math.max(0.2, (strength * 2) / resistance);

        if (next[idx].startTime == null) {
          next[idx] = { ...next[idx], startTime: Date.now() };
        }

        next[idx] = {
          ...next[idx],
          progress: Math.min(100, next[idx].progress + inc),
          status: "Under Attack",
        };

        // breached?
        if (next[idx].progress >= 100 && !next[idx].breached) {
          const dur = Math.round((Date.now() - next[idx].startTime) / 1000);
          next[idx] = { ...next[idx], breached: true, status: "BREACHED", breachTime: dur };

          // update total breached count
          const countNow = next.filter((f) => f.breached).length;
          onBreachedCountChange?.(countNow);
          writeBreachedCount(countNow);

          // after second breach → show optimization (unless all critical)
          if (idx === 1) {
            const allCritical =
              Array.isArray(threatData.types) &&
              threatData.types.length > 0 &&
              threatData.types.every((t) => normLevel(t.level) === "critical");

            if (!allCritical) {
              clearInterval(id);
              next[idx].status = "Firewall breached";
              setShowOptimization(true);
              setPreOptimizationBreachedCount(countNow);
              writePreOptimizationCount(countNow); // 🔥 write ONCE
            } else {
              setCurrentIdx(idx + 1);
            }
          }
          // progress to next
          else if (idx < prev.length - 1) {
            setCurrentIdx(idx + 1);
          }
          // last breached → finalize
          else if (idx === prev.length - 1) {
            clearInterval(id);

            const firewallBreachTimes = next.map((fw) => ({
              name: fw.name,
              timeToBreak: fw.breachTime || 0,
            }));

            const info = {
              ip: threatData.ip,
              location: getRandomLocation(),
              deviceInfo: generateDeviceInfo(),
              timeStamp: generateTimestamp(),
              types: threatData.types,
              firewallBreachTimes,
              totalBreachTime: breachStartTime
                ? Math.round((Date.now() - breachStartTime) / 1000)
                : 0,
            };

            setThreatInfo(info);
            onAllFirewallsBreached?.(info);
          }
        }

        return next;
      });
    }, 100);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, threatData, currentIdx, showOptimization, postOptimizationPhase, breachStartTime]);

  // after optimization completes, continue with slower speeds
  const handleOptimizationComplete = () => {
    setShowOptimization(false);
    setPostOptimizationPhase(true);
    setCurrentIdx(2); // continue at 3rd firewall
  };

  // ---------- render ---------------------------------------------------------

  return (
    <div className={`firewall-system ${active ? "active" : "inactive"}`}>
      <div className="system-header">
        <h2>Firewall Defense System</h2>
        <div
          className={`system-status ${
            firewalls.every((f) => !f.breached)
              ? "secure"
              : firewalls.every((f) => f.breached)
              ? "compromised"
              : "warning"
          }`}
        >
          {firewalls.every((f) => !f.breached)
            ? "Fully Protected"
            : firewalls.every((f) => f.breached)
            ? "SYSTEM COMPROMISED"
            : "Partial Breach"}
        </div>
      </div>

      <div className="firewalls-container">
        {firewalls.map((fw) => (
          <div
            key={fw.id}
            className={`firewall-unit ${
              fw.breached ? "breached" : fw.progress > 0 ? "under-attack" : ""
            }`}
          >
            <div className="firewall-header">
              <h3>{fw.name}</h3>
              <div
                className={`status-indicator ${
                  fw.breached ? "breached" : fw.progress > 0 ? "warning" : "secure"
                }`}
              >
                {fw.status}
              </div>
            </div>

            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${fw.progress}%` }} />
              </div>
              <div className="progress-text">
                {fw.breached
                  ? "Breach Completed"
                  : `${Math.round(fw.progress)}% Compromised`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Breach summary (uses 'threatInfo' — fixed) */}
      {threatInfo && firewalls.every((f) => f.breached) && (
        <div className="breach-summary">
          <h3>
            <i className="fas fa-exclamation-triangle"></i> Security Breach Detected
          </h3>
          <div className="breach-details">
            <div className="detail-row">
              <span className="detail-label">Source IP:</span>
              <span className="detail-value">{threatInfo.ip}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{threatInfo.location}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Device:</span>
              <span className="detail-value">{threatInfo.deviceInfo}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Timestamp:</span>
              <span className="detail-value">{threatInfo.timeStamp}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Breach Time:</span>
              <span className="detail-value">
                {threatInfo.totalBreachTime} seconds
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Threat Types:</span>
              <div className="detail-value threat-types">
                {(threatInfo.types || []).map((t, i) => (
                  <span key={i} className={`threat-badge ${normLevel(t.level)}`}>
                    {t.type === "TCPIP" ? "TCP/IP" : t.type}
                    <small>({t.level})</small>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showOptimization && (
        <AIOptimizationPopup onComplete={handleOptimizationComplete} />
      )}
    </div>
  );
};

export default FirewallSystem;
