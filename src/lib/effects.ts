export const EFFECTS_MAP: Record<string, { name: string, className: string }> = {
    '7000': { 
        name: 'Blackout', 
        className: 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] font-black tracking-wider' 
    },
    '7001': { 
        name: 'Sprinter', 
        className: 'text-transparent bg-[linear-gradient(90deg,#a855f7,#6366f1,#818cf8)] bg-clip-text drop-shadow-[0_0_12px_rgba(139,92,246,0.6)] font-black' 
    },
    '7002': { 
        name: 'Redline', 
        className: 'text-transparent bg-[linear-gradient(90deg,#ef4444,#b91c1c)] bg-clip-text drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] font-black animate-pulse' 
    },
    '7003': { 
        name: 'Void', 
        className: 'text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.5)] font-black tracking-widest' 
    },
    '7004': { 
        name: 'Execution', 
        className: 'text-transparent bg-[linear-gradient(90deg,#f59e0b,#fbbf24)] bg-clip-text drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] font-black' 
    },
    '7005': { 
        name: 'System Failure', 
        className: 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] font-black tracking-widest' 
    },
    '7006': { 
        name: 'Final Run', 
        className: 'text-transparent bg-[linear-gradient(90deg,#3b82f6,#0ea5e9)] bg-clip-text drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] font-black' 
    }
};
