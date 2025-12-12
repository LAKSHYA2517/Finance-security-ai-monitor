import { useState, useEffect } from 'react';
import apiClient from '../api/axiosClient';
import { 
  Shield, Activity, Moon, Sun, MapPin, Smartphone, ThumbsUp, ThumbsDown, Globe, FileText, Cpu, AlertOctagon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import AttackMap from '../components/AttackMap'; 
import './Dashboard.css';

const processRealTimeData = (historyLog) => {
    if (!historyLog || historyLog.length === 0) return [{time:'Now', normal:0, suspicious:0}];
    const groups = {};
    [...historyLog].reverse().forEach(log => {
        const timeLabel = log.time.split(', ')[1] || log.time; 
        if (!groups[timeLabel]) groups[timeLabel] = { time: timeLabel, normal: 0, suspicious: 0 };
        if (log.status.includes('Success')) groups[timeLabel].normal += 1;
        else groups[timeLabel].suspicious += 1;
    });
    return Object.values(groups);
};

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]); 
  // ✨ 1. DARK MODE STATE
  const [darkMode, setDarkMode] = useState(false);

  // ✨ 2. THEME EFFECT
  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [darkMode]);

  // --- WEBSOCKET & FETCHING ---
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    const wsUrl = baseUrl.replace(/^http/, "ws").replace(/\/$/, ""); 
    let ws = new WebSocket(`${wsUrl}/ws/alerts`);
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "CRITICAL_ALERT") {
                const newAlertId = Date.now();
                setAlerts(prev => {
                   if (prev.find(a => newAlertId - a.id < 500)) return prev;
                   return [{ id: newAlertId, msg: data.message }, ...prev];
                });
                setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== newAlertId)), 5000);
                fetchHistory();
            }
        } catch(e) {}
    };
    return () => { if (ws.readyState === 1) ws.close(); };
  }, []);

  const fetchHistory = async () => {
      try { const res = await apiClient.get('/security/history'); setHistory(Array.isArray(res.data) ? res.data : []); } 
      catch (e) {}
  };
  useEffect(() => { fetchHistory(); const i = setInterval(fetchHistory, 2000); return () => clearInterval(i); }, []);
  
  const handleVerify = async (logId, action) => {
      await apiClient.post('/security/feedback', { log_id: logId, action: action });
      fetchHistory();
  };
  const handleDownloadReport = async (logId) => {
      try {
          const response = await apiClient.get(`/security/report/${logId}`, { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Forensic_Report_${logId.substring(0,5)}.pdf`);
          document.body.appendChild(link); link.click();
      } catch (e) { alert("Backend PDF Error"); }
  };
  const openSimulator = () => window.open('/login', 'BankSimulator', 'width=400,height=750');

  // --- METRICS ---
  const safeHistory = Array.isArray(history) ? history : [];
  const latestLog = safeHistory[0];
  const trendData = processRealTimeData(safeHistory);
  const riskPercent = latestLog ? Math.round(latestLog.risk_score * 100) : 0;
  const safePercent = 100 - riskPercent;
  const gaugeColor = safePercent > 80 ? '#10b981' : safePercent > 50 ? '#f59e0b' : '#ef4444';
  const donutData = [{ value: safePercent }, { value: riskPercent }];
  const failedCount = safeHistory.filter(h => h.status.includes('Block') || h.status.includes('Suspicious')).length;

  return (
    <div className="dashboard-container">
      {/* ALERTS */}
      <div className="toast-container" style={{position:'fixed', top:20, right:20, zIndex:999}}>
        {alerts.map((alert, i) => (
          <div key={i} className="toast" style={{background: darkMode ? '#1e293b' : 'white', color: darkMode?'white':'black', padding:'15px', borderRadius:'10px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)', display:'flex', gap:'10px', borderLeft:'4px solid #ef4444', marginBottom:'10px'}}>
             <AlertOctagon color="#ef4444" size={24} />
             <div><h4 style={{margin:0}}>Security Alert</h4><p style={{margin:0, fontSize:12, opacity:0.8}}>{alert.msg}</p></div>
          </div>
        ))}
      </div>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <Shield size={28} color="#4f46e5" fill="#4f46e5" fillOpacity={0.2} />
          <span>SecureWatch AI</span>
        </div>
        <div className="nav-links">
            {/* ✨ 3. THEME TOGGLE BUTTON */}
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle Theme">
               {darkMode ? <Sun size={20} color="#f59e0b"/> : <Moon size={20} color="#64748b"/>}
            </button>
            <div className="launch-btn" onClick={openSimulator}>
                <Smartphone size={16}/> Live Simulator
            </div>
            <div className="avatar" style={{width:35, height:35, background:'#4f46e5', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold'}}>AD</div>
        </div>
      </nav>

      <div className="stats-grid">
        {/* CARD 1: STATUS & AI BOX */}
        <div className="card">
          <div className="card-header"><h3>Security Status</h3><Activity size={20} color="var(--text-muted)"/></div>
          <div className="donut-layout">
            <div className="donut-wrapper">
               <PieChart width={180} height={180}>
                  <Pie data={donutData} innerRadius={65} outerRadius={85} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                    <Cell fill={gaugeColor} /> <Cell fill={darkMode ? "#334155" : "#f1f5f9"} />
                  </Pie>
               </PieChart>
               <div className="risk-label">
                  <h2 style={{color: gaugeColor}}>{safePercent}%</h2><span>Safe</span>
               </div>
            </div>
            <div className="risk-details">
              <div className="metric">
                <div className="metric-text"><span>Failed Attempts</span><strong>{failedCount}</strong></div>
                <div className="bar-bg"><div className="bar-fill" style={{width: `${Math.min(failedCount*5, 100)}%`, background:'#ef4444'}}></div></div>
              </div>
              <div className="metric">
                <div className="metric-text"><span>Active Devices</span><strong>1</strong></div>
                <div className="bar-bg"><div className="bar-fill" style={{width: '20%', background:'#f59e0b'}}></div></div>
              </div>
            </div>
          </div>
          
          {/* ✨ 4. RESTORED AI BOX (With Dark Mode support) */}
          <div className="ai-box">
             <h4 style={{margin: '0 0 8px 0', display:'flex', alignItems:'center', gap:'8px', color:'#4f46e5', fontSize:'14px'}}>
               <Cpu size={16}/> AI Forensic Analysis
             </h4>
             <p style={{margin:0, color: 'var(--text-main)', fontSize:'13px', lineHeight: '1.6', fontWeight: 500}}>
               {latestLog?.ai_summary || "System monitoring active. No anomalies detected in current session traffic."}
             </p>
          </div>
        </div>

        {/* CARD 2: MAP */}
        <div className="card" style={{padding:0, overflow:'hidden', minHeight:'350px'}}>
             <div style={{padding:'20px', borderBottom:'1px solid var(--grid-line)', display:'flex', gap:'10px', alignItems:'center'}}>
                <Globe size={18} color="#4f46e5"/> <strong>Global Threat Map</strong>
             </div>
             <div style={{height:'400px'}}>
                <AttackMap logs={safeHistory} />
             </div>
        </div>
      </div>

      {/* GRAPH ROW */}
      <div className="card chart-section">
        <div className="card-header"><h3>Login Traffic Analysis</h3></div>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-line)"/>
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} dy={10}/>
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}}/>
              <Tooltip contentStyle={{backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--grid-line)', color: 'var(--text-main)'}}/>
              <Line type="monotone" dataKey="normal" stroke="#10b981" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="suspicious" stroke="#ef4444" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLE ROW */}
      <div className="card">
        <div className="card-header"><h3>Recent Transactions</h3></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Time</th><th>Location</th><th>Device</th><th>Risk Score</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {safeHistory.map((row) => (
                 <tr key={row.id}>
                    <td style={{color:'var(--text-muted)'}}>{row.time}</td>
                    <td><div style={{display:'flex', alignItems:'center', gap:'5px'}}><MapPin size={14} color="var(--text-muted)"/> {row.location}</div></td>
                    <td style={{fontSize:'13px', color:'var(--text-muted)'}}>{row.device}</td>
                    <td><span style={{color: row.risk_score > 0.8 ? '#ef4444' : '#10b981', fontWeight:'bold'}}>{(row.risk_score*100).toFixed(0)}%</span></td>
                    <td>
                        <span style={{
                            padding:'4px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:'bold',
                            background: row.status.includes('Block') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: row.status.includes('Block') ? '#ef4444' : '#10b981'
                        }}>
                            {row.status}
                        </span>
                    </td>
                    <td>
                        <div style={{display:'flex', gap:'8px'}}>
                            <button onClick={() => handleDownloadReport(row.id)} title="Download Report" style={{border:'none', background:'transparent', cursor:'pointer'}}><FileText size={16} color="#4f46e5"/></button>
                            {!row.user_feedback && (
                                <>
                                <button onClick={() => handleVerify(row.id, 'verify_safe')} style={{border:'none', background:'transparent', cursor:'pointer'}}><ThumbsUp size={16} color="#10b981"/></button>
                                <button onClick={() => handleVerify(row.id, 'confirm_fraud')} style={{border:'none', background:'transparent', cursor:'pointer'}}><ThumbsDown size={16} color="#ef4444"/></button>
                                </>
                            )}
                        </div>
                    </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;