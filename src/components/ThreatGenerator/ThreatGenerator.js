



import React, { useState, useEffect } from 'react';
import './ThreatGenerator.css';
import { Player } from '@lottiefiles/react-lottie-player';
import { generateRandomIP } from '../../utils/firewall-utils';
// Firebase
import { db } from '../../firebase';
import { ref, get, push, update, serverTimestamp } from 'firebase/database';

/**
 * Props:
 * - targetUserId: UID of the receiver user whose domains should receive the threat
 * - attackerUid?: UID of the sender (optional meta)
 * - onThreatGenerated?: legacy callback
 */
const ThreatGenerator = ({ onThreatGenerated, targetUserId, attackerUid = null }) => {
    const [threatTypes, setThreatTypes] = useState({
        WLAN: { selected: false, level: null },
        TCPIP: { selected: false, level: null },
        HTTP: { selected: false, level: null },
        Firewall: { selected: false, level: null },
        DoS: { selected: false, level: null } // Added DoS threat type
    });

    const [generatedIP, setGeneratedIP] = useState(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [threatGenerated, setThreatGenerated] = useState(false);
    const [sending, setSending] = useState(false);

    // Domains of target user
    const [domains, setDomains] = useState([]); // [{key, domain, expiryDate}]
    const [selectedDomainKey, setSelectedDomainKey] = useState('__ALL__');
    const [domainLoadError, setDomainLoadError] = useState(null);

    // Load domains whenever targetUserId changes
    useEffect(() => {
        if (!targetUserId) {
            setDomains([]);
            return;
        }
        const domainsRef = ref(db, `users/${targetUserId}/domains`);
        get(domainsRef)
            .then(snap => {
                if (!snap.exists()) { setDomains([]); return; }
                const list = [];
                snap.forEach(c => {
                    const v = c.val() || {};
                    list.push({
                        key: c.key,
                        domain: v.domain || v.features?.id || c.key,
                        expiryDate: v.expiryDate || null
                    });
                });
                setDomains(list);
            })
            .catch(e => { console.error(e); setDomainLoadError('Domain load failed'); });
    }, [targetUserId]);

    const handleCheckboxChange = (type, level) => {
        setThreatTypes(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                selected: true,
                level
            }
        }));
    };

    const generateThreat = () => {
        const hasSelectedThreats = Object.values(threatTypes).some(threat => threat.selected);

        if (!hasSelectedThreats) {
            alert("Please select at least one threat type");
            return;
        }

        // Generate random IP
        const ip = generateRandomIP();
        setGeneratedIP(ip);

        // Show alert
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);

        // Set threat as generated
        setThreatGenerated(true);
    };

    const sendHacking = async () => {
        if (!threatGenerated) {
            alert("Please generate a threat first");
            return;
        }

        if (!targetUserId) {
            alert('No targetUserId prop provided.');
            return;
        }
        if (sending) return;
        setSending(true);

        // Collect threat data to send to parent component
        const threatData = {
            ip: generatedIP,
            types: Object.entries(threatTypes)
                .filter(([_, value]) => value.selected)
                .map(([key, value]) => ({
                    type: key,
                    level: value.level
                })),
            fromUid: attackerUid,
            targetUserId
        };
        try {
            // Determine which domains to target
            const domainKeys = selectedDomainKey === '__ALL__' ? domains.map(d => d.key) : [selectedDomainKey];

            // create a global threat push & multi-location update
            const inboxRef = ref(db, 'incomingThreats');
            const newThreatRef = push(inboxRef);
            const threatKey = newThreatRef.key;

            const basePayload = {
                ip: threatData.ip,
                types: threatData.types,
                status: 'sent',
                sentAt: serverTimestamp(),
                fromUid: attackerUid,
                targetUserId,
                domainMode: selectedDomainKey === '__ALL__' ? 'all' : 'single',
                targetDomains: domainKeys
            };

            // Build multi-location updates
            const updates = {};
            updates[`incomingThreats/${threatKey}`] = basePayload;
            domainKeys.forEach(dk => {
                updates[`users/${targetUserId}/domains/${dk}/incomingThreats/${threatKey}`] = {
                    ip: threatData.ip,
                    types: threatData.types,
                    status: 'sent',
                    sentAt: serverTimestamp(),
                    globalKey: threatKey,
                    fromUid: attackerUid
                };
            });

            await update(ref(db), updates);
            onThreatGenerated && onThreatGenerated({ ...threatData, threatKey, targetDomains: domainKeys });
            alert('Threat sent to ' + (domainKeys.length > 1 ? `${domainKeys.length} domains` : '1 domain'));
        } catch (e) {
            console.error('Send threat failed:', e);
            alert('Failed to send: ' + e.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="threat-generator">
            <div className="threat-header">
                <div className="threat-title">
                    <h2>Threat Generator</h2>
                    <span className="subtitle">Select threat parameters to initiate</span>
                </div>
                <div className="animation-container">
                <Player
                  autoplay
                  loop
                  src="https://assets4.lottiefiles.com/packages/lf20_puciaact.json"
                  style={{ height: '150px', width: '100%' }}
                />
                </div>
            </div>

            {alertVisible && (
                <div className="alert-message success">
                    <i className="fas fa-check-circle"></i>
                    Threat Successfully Generated!
                </div>
            )}

            <div className="threat-protocols">
                {Object.keys(threatTypes).map(type => (
                    <div key={type} className="protocol-card">
                        <div className="protocol-header">
                            <h3>{type === 'TCPIP' ? 'TCP/IP' : 
                                 type === 'DoS' ? 'Denial of Service' : type}</h3>
                            <div className="protocol-icon">
                                <i className={`fas ${
                                    type === 'WLAN' ? 'fa-wifi' :
                                    type === 'TCPIP' ? 'fa-network-wired' :
                                    type === 'HTTP' ? 'fa-globe' : 
                                    type === 'DoS' ? 'fa-ban' :
                                    'fa-shield-alt'
                                }`}></i>
                            </div>
                        </div>

                        <div className="level-selector">
                            <div className="level-option">
                                <input
                                    type="checkbox"
                                    id={`${type}-Advisory`}
                                    checked={threatTypes[type].level === 'Advisory'}
                                    onChange={() => handleCheckboxChange(type, 'Advisory')}
                                />
                                <label htmlFor={`${type}-Advisory`}>Advisory</label>
                            </div>

                            <div className="level-option">
                                <input
                                    type="checkbox"
                                    id={`${type}-Warning`}
                                    checked={threatTypes[type].level === 'Warning'}
                                    onChange={() => handleCheckboxChange(type, 'Warning')}
                                />
                                <label htmlFor={`${type}-Warning`}>Warning</label>
                            </div>

                            <div className="level-option">
                                <input
                                    type="checkbox"
                                    id={`${type}-critical`}
                                    checked={threatTypes[type].level === 'critical'}
                                    onChange={() => handleCheckboxChange(type, 'critical')}
                                />
                                <label htmlFor={`${type}-critical`}>Critical</label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="threat-actions">
                <div className="domain-selector" style={{ width: '100%', marginBottom: 16 }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Target Domain(s)</label>
                    {!targetUserId && <div style={{ color: '#c0392b', fontSize: 12 }}>Provide targetUserId prop to enable sending.</div>}
                    {domainLoadError && <div style={{ color: '#c0392b', fontSize: 12 }}>{domainLoadError}</div>}
                    {targetUserId && domains.length === 0 && !domainLoadError && (
                        <div style={{ color: '#7f8c8d', fontSize: 12 }}>No domains found. Threat will appear only in global inbox.</div>
                    )}
                    {domains.length > 0 && (
                        <select value={selectedDomainKey} onChange={e => setSelectedDomainKey(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, width: '100%' }}>
                            <option value="__ALL__">All Domains ({domains.length})</option>
                            {domains.map(d => <option key={d.key} value={d.key}>{d.domain}</option>)}
                        </select>
                    )}
                </div>
                <button
                    className="generate-button"
                    onClick={generateThreat}
                >
                    Generate Threat
                </button>

                {generatedIP && (
                    <div className="ip-display">
                        <span className="ip-label">Generated Threat IP:</span>
                        <span className="ip-value">{generatedIP}</span>
                        {/* Show selected / targeted domain names */}
                        <div style={{ marginTop: 8, fontSize: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontWeight: 600 }}>Target Domain(s):</span>
                            <span style={{ color: '#4ade80' }}>
                                {(() => {
                                    if (!targetUserId) return '— (no target user)';
                                    if (domains.length === 0) return 'Global Inbox (no domains)';
                                    if (selectedDomainKey === '__ALL__') {
                                        return domains.map(d => d.domain).join(', ');
                                    }
                                    const found = domains.find(d => d.key === selectedDomainKey);
                                    return found ? found.domain : '(unknown domain)';
                                })()}
                            </span>
                        </div>
                        <button className="send-hack-button" onClick={sendHacking} disabled={sending}>
                            <i className="fas fa-bug"></i> {sending ? 'Sending...' : 'Send Hacking'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThreatGenerator;