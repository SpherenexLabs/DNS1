



import React, { useEffect, useRef, useState } from "react";
import "./Dashboard.css";

import AISecuritySystem from "../AISecuritySystem/AISecuritySystem";
import FirewallSystem from "../FirewallSystem/FirewallSystem";
// import BreachDetection from "../BreachDetection/BreachDetection";
import AIOptimizationAnalysis from "../AIOptimizationAnalysis/AIOptimizationAnalysis";
import UserProfile from "../UserProfile/UserProfile";

import { db } from "../../firebase";
import {
  ref,
  query,
  orderByKey,
  startAt,
  limitToLast,
  onChildAdded,
  get,
} from "firebase/database";

const Dashboard = ({ username = "admin", userUid = null }) => {
  // profile modal
  const [showProfile, setShowProfile] = useState(false);
  // Use the UID from Firebase data we saw, or default to admin's UID
  const effectiveUid = userUid || "9tFjcN5ZSuNZjvgxjGg3ZUV3HsB3";
  const [threatData, setThreatData] = useState(null);

  // pipeline flags
  const [aiActive, setAiActive] = useState(false);
  const [firewallActive, setFirewallActive] = useState(false);
  const [threatAnalyzed, setThreatAnalyzed] = useState(false);

  // breach / history
  const [breachDetected, setBreachDetected] = useState(false);
  const [intruderInfo, setIntruderInfo] = useState(null);
  const [threatHistory, setThreatHistory] = useState([]);

  // UI
  const [alertMessage, setAlertMessage] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // how many firewalls are fully breached (reported by FirewallSystem)
  const [breachedCount, setBreachedCount] = useState(0);

  // prevent double-processing of the same push id
  const processedKeys = useRef(new Set());

  useEffect(() => {
    let unsubscribe = () => {};
    const incomingRef = ref(db, "incomingThreats");

    const attach = async () => {
      // 1) Find the current last key at the moment of page load
      const lastSnap = await get(query(incomingRef, limitToLast(1)));
      let lastKey = null;
      if (lastSnap.exists()) {
        lastSnap.forEach((c) => (lastKey = c.key));
      }

      // 2) Build a listener that only fires for NEW items
      if (lastKey) {
        const q = query(incomingRef, orderByKey(), startAt(lastKey));
        unsubscribe = onChildAdded(q, (snap) => {
          // Ignore the existing "last" item from step 1
          if (snap.key === lastKey) return;
          handleIncoming(snap.key, snap.val());
        });
      } else {
        // No items exist yet; the first future add will be new
        const q = query(incomingRef, orderByKey());
        unsubscribe = onChildAdded(q, (snap) => {
          handleIncoming(snap.key, snap.val());
        });
      }
    };

    const handleIncoming = (key, val) => {
      if (!val) return;
      if (processedKeys.current.has(key)) return;
      processedKeys.current.add(key);

      // only process "sent" threats
      if (val.status && val.status !== "sent") return;

      const payload = {
        ip: val.ip,
        types: Array.isArray(val.types) ? val.types : [],
        threatKey: key,               // this is the inbox key
        fromUid: val.fromUid || null,
        sourceKey: val.sourceKey || null,
        sentAt: val.sentAt || null,
      };

      // Announce
      setAlertMessage({
        type: "warning",
        message: `New threat received from IP ${payload.ip}. AI Security System activated.`,
      });
      setTimeout(() => setAlertMessage(null), 4000);

      // Kick off pipeline
      setThreatData(payload);
      setAiActive(true);
      setThreatAnalyzed(false);
      setFirewallActive(false);

      // reset breach state for the new threat
      setBreachedCount(0);
      setBreachDetected(false);
      setIntruderInfo(null);
    };

    attach();

    return () => unsubscribe();
  }, []);

  const handleThreatAnalyzed = (data) => {
    setThreatAnalyzed(true);
    setAlertMessage({
      type: "warning",
      message: `AI Security System: Threat from IP ${data.ip} analyzed. Engaging firewall defenses.`,
    });
    setFirewallActive(true);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleAllFirewallsBreached = (info) => {
    setBreachDetected(true);
    setIntruderInfo(info);

    const newThreat = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      info,
      recoveryTime: Math.floor(Math.random() * 600) + 300, // 300–900s
      firewallsBreached: 4,
    };
    setThreatHistory((prev) => [...prev, newThreat]);

    setAlertMessage({
      type: "critical",
      message: "CRITICAL ALERT: All firewalls breached! System compromised!",
    });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const toggleAnalysis = () => setShowAnalysis((v) => !v);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="logo-area">
          <h1>CyberShield</h1>
          <span className="subtitle">Advanced Security System</span>
        </div>
        <div className="user-info">
          <span className="welcome-text">Welcome, {username}</span>
          {effectiveUid && (
            <button
              style={{
                marginLeft: 12,
                background: "#173a42",
                border: "1px solid #246068",
                color: "#7ff3ce",
                padding: "6px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
              onClick={() => setShowProfile(true)}
            >
              User Profile
            </button>
          )}
          <span className="status-text">
            System Status: {breachDetected ? "COMPROMISED" : "Protected"}
          </span>
        </div>
      </div>

      {alertMessage && (
        <div className={`alert-message ${alertMessage.type}`}>
          {alertMessage.message}
        </div>
      )}

      <div className="dashboard-content">
        {showAnalysis ? (
          <AIOptimizationAnalysis
            threatData={threatData}
            intruderInfo={intruderInfo}
            threatHistory={threatHistory}
            onClose={toggleAnalysis}
          />
        ) : (
          <>
            <div className="dashboard-column">
              <AISecuritySystem
                threatData={threatData}          // { ip, types, threatKey, ... }
                isActive={aiActive}               // turns the AI on
                onThreatAnalyzed={handleThreatAnalyzed}
                breachedCount={breachedCount}     // saved by AISecuritySystem if you persist it
              />
            </div>

            <div className="dashboard-column">
              <FirewallSystem
                threatData={threatData}
                active={firewallActive && threatAnalyzed}
                onAllFirewallsBreached={handleAllFirewallsBreached}
                onBreachedCountChange={setBreachedCount}
              />

              {breachDetected && intruderInfo && (
                <div className="analysis-button-container">
                  <button className="ai-analysis-button" onClick={toggleAnalysis}>
                    <i className="fas fa-chart-line"></i> AI Optimization Analysis
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {showProfile && effectiveUid && (
        <UserProfile uid={effectiveUid} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default Dashboard;
