import React, { useEffect, useState, useMemo } from 'react';
import './UserProfile.css';
import { db } from '../../firebase';
import { ref, get, query, orderByKey, startAt, limitToLast, onChildAdded } from 'firebase/database';

/**
 * Displays a user's full profile: domains purchased and threats targeting them.
 * Props:
 *  - uid (required)
 *  - onClose
 */
const UserProfile = ({ uid, onClose }) => {
  const [user, setUser] = useState(null);
  const [domains, setDomains] = useState([]);
  const [threats, setThreats] = useState([]); // {key, ip, types[], sentAt, fromUid, status}
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);

  // Hardcoded user data based on Firebase export you showed
  const mockUserData = {
    "9tFjcN5ZSuNZjvgxjGg3ZUV3HsB3": {
      name: "Sushma C K",
      email: "spherenexdeveloper@gmail.com",
      createdAt: "2025-10-04T11:21:28.917Z",
      photoURL: "https://lh3.googleusercontent.com/a/ACg8ocJGgfHwHPyVlA_AsfJwvHJ9PRf6rwb26D0rBSNRY50tbZ3xpw=s96-c",
      domains: {
        "domain_1759577754936": {
          domain: "example1.com",
          status: "active"
        },
        "domain_1759578117392": {
          dnsRecords: {
            domain: "safenet.io",
            expiryDate: "2026-10-04T11:41:57.392Z"
          },
          features: {
            id: "domain_1759578117392",
            owner: "Spherenex Innovation labs",
            paymentStatus: "completed",
            price: 1899,
            purchasedAt: "2025-10-04T11:41:57.392Z",
            status: "active",
            transactionId: "TXN_1759578117392_i1jqhe988"
          }
        }
      }
    },
    "Io798GFtDDbupURCAQcKapnDjRH2": {
      name: "manu",
      email: "manu@gmail.com",
      createdAt: 1759575694140,
      lastLoginAt: 1759575694140,
      domains: {}
    }
  };

  // Mock threat data
  const mockThreats = [
    {
      key: "threat1",
      ip: "240.72.55.136",
      types: [
        { type: "WLAN", level: "critical" },
        { type: "HTTP", level: "warning" }
      ],
      sentAt: new Date().toISOString(),
      fromUid: "Io798GFtDDbupURCAQcKapnDjRH2",
      status: "sent"
    }
  ];

  // Load user data (mock for now)
  useEffect(() => {
    if (!uid) return;
    
    const userData = mockUserData[uid];
    if (userData) {
      setUser({
        uid,
        name: userData.name || uid,
        email: userData.email || '',
        createdAt: userData.createdAt || null,
        lastLoginAt: userData.lastLoginAt || null,
        photoURL: userData.photoURL || null,
      });
      
      const dRaw = userData.domains || {};
      const dList = Object.keys(dRaw).map(k => {
        const dv = dRaw[k] || {};
        const dns = dv.dnsRecords || {};
        return {
          key: k,
          domain: dns.domain || dv.domain || dv.features?.id || k,
          expiryDate: dns.expiryDate || dv.expiryDate || null,
          status: dv.features?.status || dv.status || 'active',
          purchasedAt: dv.features?.purchasedAt || dv.purchasedAt || null,
          price: dv.features?.price || dv.price || null,
          owner: dv.features?.owner || dv.owner || null,
          transactionId: dv.features?.transactionId || null,
          raw: dv,
        };
      });
      setDomains(dList);
      
      // Set mock threats for this user
      setThreats(mockThreats.filter(t => t.targetUserId === uid || Math.random() > 0.5));
      
      setError(null);
    } else {
      setUser({
        uid,
        name: uid,
        email: 'User not found in mock data',
        createdAt: null,
        lastLoginAt: null,
        photoURL: null,
      });
      setDomains([]);
      setThreats([]);
      setError('User not found in sample data');
    }
    
    setLoading(false);
    setListening(true);
  }, [uid]);

  const totalCritical = useMemo(() => threats.filter(t => t.types.some(x => String(x.level).toLowerCase()==='critical')).length, [threats]);
  const totalWarning = useMemo(() => threats.filter(t => t.types.some(x => String(x.level).toLowerCase()==='warning')).length, [threats]);
  const totalAdvisory = useMemo(() => threats.filter(t => t.types.some(x => String(x.level).toLowerCase()==='advisory')).length, [threats]);

  return (
    <div className="user-profile-backdrop">
      <div className="user-profile-modal">
        <div className="user-profile-header">
          <div>
            <h2>User Profile</h2>
            <div style={{fontSize:13, color:'#7baab8'}}>UID: {uid}</div>
          </div>
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
        {loading ? <div>Loading profile...</div> : (
          <>
            {error && (
              <div style={{background:'#2d1b1b',border:'1px solid #5c2e2e',padding:'12px 16px',borderRadius:8,marginBottom:20,color:'#ffb3b3'}}>
                <strong>Demo Mode:</strong> {error}
                <div style={{fontSize:12,marginTop:4,color:'#d4a5a5'}}>
                  Using sample data from Firebase export. In production, this would connect to live Firebase data.
                </div>
              </div>
            )}
            <div className="split-row">
              <div style={{flex:1,minWidth:280}} className="section">
                <h3>Identity</h3>
                <div className="kv-grid">
                  <div className="k">Name:</div><div>{user?.name || '—'}</div>
                  <div className="k">Email:</div><div>{user?.email || '—'}</div>
                  <div className="k">Created:</div><div>{user?.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</div>
                  <div className="k">Last Login:</div><div>{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}</div>
                  <div className="k">Domains:</div><div>{domains.length}</div>
                  <div className="k">Threats Seen:</div><div>{threats.length}</div>
                </div>
                <div className="mini-stats" style={{marginTop:18}}>
                  <div className="mini-stat"><h4>Critical Threats</h4><div className="val">{totalCritical}</div></div>
                  <div className="mini-stat"><h4>Warning Threats</h4><div className="val">{totalWarning}</div></div>
                  <div className="mini-stat"><h4>Advisory Threats</h4><div className="val">{totalAdvisory}</div></div>
                </div>
              </div>
              <div style={{flex:2,minWidth:420}} className="section">
                <h3>Purchased Domains</h3>
                {domains.length === 0 ? (
                  <div className="empty">
                    No domains purchased by this user.
                  </div>
                ) : (
                  <div className="domains-grid">
                    {domains.map(d => (
                      <div key={d.key} className="domain-card">
                        <div className="domain-title">{d.domain}</div>
                        <div style={{fontSize:12, color:'#89c5d2'}}>Status: <span className="status-pill">{d.status}</span></div>
                        <div style={{fontSize:12}}><span className="k" style={{color:'#6aa9b9'}}>Expiry:</span> {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}</div>
                        <div style={{fontSize:12}}><span className="k" style={{color:'#6aa9b9'}}>Purchased:</span> {d.purchasedAt ? new Date(d.purchasedAt).toLocaleString() : '—'}</div>
                        {d.price && <div style={{fontSize:12}}>Price: ₹{d.price}</div>}
                        {d.owner && <div style={{fontSize:12}}>Owner: {d.owner}</div>}
                        {d.transactionId && <div style={{fontSize:11, color:'#7ab3c2'}}>Transaction: {d.transactionId}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="section">
              <h3>Incoming Threats Targeting User</h3>
              <div className="threats-wrapper">
                {threats.length === 0 ? (
                  <div className="empty">
                    No threats targeting this user yet.
                  </div>
                ) : (
                  <table className="threats-table">
                    <thead>
                      <tr>
                        <th style={{width:120}}>Time</th>
                        <th style={{width:120}}>IP</th>
                        <th>Types</th>
                        <th style={{width:90}}>Status</th>
                        <th style={{width:120}}>From UID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {threats.map(t => (
                        <tr key={t.key}>
                          <td>{t.sentAt ? new Date(t.sentAt).toLocaleTimeString() : '—'}</td>
                          <td>{t.ip}</td>
                          <td>{t.types.map((x,i)=>(<span key={i} style={{marginRight:6}}>{x.type}<span className="inline-level">{x.level}</span></span>))}</td>
                          <td><span className="status-pill">{t.status}</span></td>
                          <td>{t.fromUid || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
