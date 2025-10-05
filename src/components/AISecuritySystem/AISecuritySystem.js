




// import React, { useEffect, useState } from "react";
// import "./AISecuritySystem.css";
// import { Player } from "@lottiefiles/react-lottie-player";

// const AISecuritySystem = ({ threatData, isActive, onThreatAnalyzed }) => {
//   const [localActive, setLocalActive] = useState(false); // auto-activate on new data
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [threatDetected, setThreatDetected] = useState(false);
//   const [threatDetails, setThreatDetails] = useState(null);

//   const effectiveActive = isActive || localActive;

//   // Auto-activate when new threatData arrives (from receiver listener)
//   useEffect(() => {
//     if (!threatData) return;

//     setThreatDetails(threatData);
//     setLocalActive(true);
//     setIsAnalyzing(true);
//     setThreatDetected(false);

//     const t = setTimeout(() => {
//       setIsAnalyzing(false);
//       setThreatDetected(true);
//       onThreatAnalyzed && onThreatAnalyzed(threatData);
//     }, 3000);

//     return () => clearTimeout(t);
//   }, [threatData, onThreatAnalyzed]);

//   // Also support parent forcing isActive without changing threatData (optional)
//   useEffect(() => {
//     if (isActive && threatData) {
//       // if parent toggles isActive on, ensure we’re in analyze cycle
//       setLocalActive(true);
//     }
//   }, [isActive, threatData]);

//   return (
//     <div className={`ai-security-system ${effectiveActive ? "active" : "inactive"}`}>
//       <div className="ai-header">
//         <div className="ai-title">
//           <h2>AI Security System</h2>
//           <span className="subtitle">Real-time threat analysis and prevention</span>
//         </div>
//         <div className="ai-status-badge">
//           {effectiveActive ? (
//             <div className="status-active">
//               <span className="status-dot"></span>
//               Active
//             </div>
//           ) : (
//             <div className="status-standby">
//               <span className="status-dot"></span>
//               Standby
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="ai-visualization">
//         <Player
//           autoplay={effectiveActive}
//           loop
//           src={
//             isAnalyzing
//               ? "https://assets2.lottiefiles.com/packages/lf20_vvbgxgg3.json" // analyzing
//               : threatDetected
//               ? "https://assets9.lottiefiles.com/packages/lf20_rmlsynjm.json" // alert
//               : "https://assets7.lottiefiles.com/packages/lf20_qp1q7mct.json" // idle
//           }
//           style={{ height: "240px", width: "100%" }}
//         />
//       </div>

//       <div className="ai-status-panel">
//         <div className="status-row">
//           <span className="status-label">System Status:</span>
//           <span className="status-value">
//             {effectiveActive
//               ? isAnalyzing
//                 ? "Analyzing Threat..."
//                 : threatDetected
//                 ? "Threat Detected!"
//                 : "Monitoring Network"
//               : "Standby Mode"}
//           </span>
//         </div>

//         <div className="status-row">
//           <span className="status-label">Protection Level:</span>
//           <span className="status-value">{effectiveActive ? "Maximum" : "Passive"}</span>
//         </div>

//         <div className="status-row">
//           <span className="status-label">Last Scan:</span>
//           <span className="status-value">
//             {effectiveActive ? new Date().toLocaleTimeString() : "N/A"}
//           </span>
//         </div>
//       </div>

//       {threatDetected && threatDetails && (
//         <div className="threat-details-panel">
//           <h3>
//             <i className="fas fa-exclamation-triangle"></i>
//             Threat Detected
//           </h3>
//           <div className="threat-info">
//             <div className="info-row">
//               <span className="info-label">IP Address:</span>
//               <span className="info-value">{threatDetails.ip}</span>
//             </div>
//             <div className="info-row">
//               <span className="info-label">Threat Types:</span>
//               <div className="info-value threat-types">
//                 {(threatDetails.types || []).map((t, i) => (
//                   <span key={i} className={`threat-badge ${t.level || ""}`}>
//                     {t.type === "TCPIP" ? "TCP/IP" : t.type}
//                     {t.level ? <small>({t.level})</small> : null}
//                   </span>
//                 ))}
//               </div>
//             </div>
//             <div className="info-row">
//               <span className="info-label">Detected:</span>
//               <span className="info-value">{new Date().toLocaleString()}</span>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AISecuritySystem;






// src/AISecuritySystem/AISecuritySystem.js
import React, { useEffect, useState } from "react";
import "./AISecuritySystem.css";
import { Player } from "@lottiefiles/react-lottie-player";

// 🔥 Firebase
import { db } from "../../firebase";
import { ref, update, serverTimestamp } from "firebase/database";

/**
 * Props:
 * - threatData: { ip, types, threatKey, ... }
 * - isActive: boolean (parent can force on)
 * - onThreatAnalyzed: fn(threatData)
 * - breachedCount: number  <-- NEW: how many firewalls reached 100% (from FirewallSystem via Dashboard)
 */
const AISecuritySystem = ({ threatData, isActive, onThreatAnalyzed, breachedCount }) => {
  const [localActive, setLocalActive] = useState(false); // auto-activate on new data
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [threatDetected, setThreatDetected] = useState(false);
  const [threatDetails, setThreatDetails] = useState(null);

  const effectiveActive = isActive || localActive;

  // Auto-activate on new threatData
  useEffect(() => {
    if (!threatData) return;

    setThreatDetails(threatData);
    setLocalActive(true);
    setIsAnalyzing(true);
    setThreatDetected(false);

    const t = setTimeout(() => {
      setIsAnalyzing(false);
      setThreatDetected(true);
      onThreatAnalyzed && onThreatAnalyzed(threatData);
    }, 3000);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threatData]);

  // Keep compatibility with explicit isActive
  useEffect(() => {
    if (isActive && threatData) setLocalActive(true);
  }, [isActive, threatData]);

  // ✅ NEW: whenever breachedCount changes, store it on this threat in Firebase
  useEffect(() => {
    if (
      typeof breachedCount === "number" &&
      breachedCount >= 0 &&
      threatDetails?.threatKey
    ) {
      const path = `incomingThreats/${threatDetails.threatKey}`;
      update(ref(db, path), {
        breachedCount,
        breachedUpdatedAt: serverTimestamp(),
      }).catch((e) => console.error("Failed to update breachedCount:", e));
    }
  }, [breachedCount, threatDetails?.threatKey]);

  return (
    <div className={`ai-security-system ${effectiveActive ? "active" : "inactive"}`}>
      <div className="ai-header">
        <div className="ai-title">
          <h2>AI Security System</h2>
          <span className="subtitle">Real-time threat analysis and prevention</span>
        </div>
        <div className="ai-status-badge">
          {effectiveActive ? (
            <div className="status-active">
              <span className="status-dot"></span>
              Active
            </div>
          ) : (
            <div className="status-standby">
              <span className="status-dot"></span>
              Standby
            </div>
          )}
        </div>
      </div>

      <div className="ai-visualization">
        <Player
          autoplay={effectiveActive}
          loop
          src={
            isAnalyzing
              ? "https://assets2.lottiefiles.com/packages/lf20_vvbgxgg3.json" // analyzing
              : threatDetected
              ? "https://assets9.lottiefiles.com/packages/lf20_rmlsynjm.json" // alert
              : "https://assets7.lottiefiles.com/packages/lf20_qp1q7mct.json" // idle
          }
          style={{ height: "240px", width: "100%" }}
        />
      </div>

      <div className="ai-status-panel">
        <div className="status-row">
          <span className="status-label">System Status:</span>
          <span className="status-value">
            {effectiveActive
              ? isAnalyzing
                ? "Analyzing Threat..."
                : threatDetected
                ? "Threat Detected!"
                : "Monitoring Network"
              : "Standby Mode"}
          </span>
        </div>

        <div className="status-row">
          <span className="status-label">Protection Level:</span>
          <span className="status-value">{effectiveActive ? "Maximum" : "Passive"}</span>
        </div>

        <div className="status-row">
          <span className="status-label">Last Scan:</span>
          <span className="status-value">
            {effectiveActive ? new Date().toLocaleTimeString() : "N/A"}
          </span>
        </div>

        {/* OPTIONAL: show live breachedCount */}
        {typeof breachedCount === "number" && (
          <div className="status-row">
            <span className="status-label">Firewalls Breached:</span>
            <span className="status-value">{breachedCount}</span>
          </div>
        )}
      </div>

      {threatDetected && threatDetails && (
        <div className="threat-details-panel">
          <h3>
            <i className="fas fa-exclamation-triangle"></i>
            {(threatDetails.types || []).some(t => String(t.level).toLowerCase() === 'critical') 
              ? 'MALICIOUS THREAT DETECTED!' 
              : 'Threat Detected'}
          </h3>
          <div className="threat-info">
            <div className="info-row">
              <span className="info-label">IP Address:</span>
              <span className="info-value">{threatDetails.ip}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Threat Types:</span>
              <div className="info-value threat-types">
                {(threatDetails.types || []).map((t, i) => (
                  <span key={i} className={`threat-badge ${t.level || ""} ${String(t.level).toLowerCase() === 'critical' ? 'malicious' : ''}`}>
                    {t.type === "TCPIP" ? "TCP/IP" : t.type}
                    {t.level ? <small>({t.level})</small> : null}
                  </span>
                ))}
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">Detected:</span>
              <span className="info-value">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISecuritySystem;
