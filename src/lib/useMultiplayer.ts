import { useState, useEffect, useRef } from 'react';
import { getSupabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const sanitizeString = (str: any, maxLength = 50) => {
    if (typeof str !== 'string') return '';
    const cleanStr = str.slice(0, maxLength);
    return cleanStr.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
};

export interface MultiplayerState {
  status: 'idle' | 'challenging' | 'challenged' | 'level-select' | 'playing' | 'gameover' | 'victory';
  opponent: {
    presenceId: string;
    username: string;
    progress: number;
    time?: number;
  } | null;
  roomId: string | null;
  matchChannel: RealtimeChannel | null;
}

export function useMultiplayer(
    myPresenceId: string, 
    myUsername: string,
    onLevelSelected: (levelIndex: number) => void,
    onOpponentProgress: (progress: number) => void,
    onOpponentFinish: (time: number) => void,
    onOpponentLeft: () => void,
    onRematch: () => void
) {
  const [mpState, setMpState] = useState<MultiplayerState>({
    status: 'idle',
    opponent: null,
    roomId: null,
    matchChannel: null
  });
  
  const [incomingChallenge, setIncomingChallenge] = useState<{fromName: string, fromId: string} | null>(null);
  const mainChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    // We already have a channel for presence, we can create another one just for broadcasting, 
    // or we can just listen on another specific channel for invites.
    const channelName = `invites:${myPresenceId}`;
    const channel = supabase.channel(channelName);
    
    channel.on('broadcast', { event: 'challenge' }, (payload) => {
        setIncomingChallenge({
            fromName: sanitizeString(payload.payload.fromName, 50),
            fromId: sanitizeString(payload.payload.fromId, 100)
        });
    });

    channel.on('broadcast', { event: 'challenge-accept' }, (payload) => {
        const fromId = sanitizeString(payload.payload.fromId, 100);
        const roomId = sanitizeString(payload.payload.roomId, 100);
        const fromName = sanitizeString(payload.payload.fromName, 50);
        if (mpState.status === 'challenging' && mpState.opponent?.presenceId === fromId) {
            startMatchmaking(roomId, fromId, fromName);
        }
    });

    channel.on('broadcast', { event: 'challenge-decline' }, (payload) => {
         const fromName = sanitizeString(payload.payload.fromName, 50);
         if (mpState.status === 'challenging') {
            setMpState(s => ({ ...s, status: 'idle', opponent: null }));
            alert(`${fromName} hat die Herausforderung abgelehnt.`);
         }
    });

    channel.subscribe();
    mainChannelRef.current = channel;

    return () => {
        channel.unsubscribe();
    };
  }, [myPresenceId, mpState.status, mpState.opponent]);

  const sendChallenge = async (targetId: string, targetName: string) => {
     setMpState({
         status: 'challenging',
         opponent: { presenceId: targetId, username: targetName, progress: 0 },
         roomId: null,
         matchChannel: null
     });
     const supabase = getSupabase();
     const targetChannel = supabase.channel(`invites:${targetId}`);
     await targetChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            targetChannel.send({
                type: 'broadcast',
                event: 'challenge',
                payload: { fromId: myPresenceId, fromName: myUsername }
            });
            targetChannel.unsubscribe();
        }
     });
  };

  const acceptChallenge = async () => {
    if (!incomingChallenge) return;
    const roomId = `match-${Date.now()}`;
    const supabase = getSupabase();
    
    // Notify challenger
    const targetChannel = supabase.channel(`invites:${incomingChallenge.fromId}`);
    await targetChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            targetChannel.send({
                type: 'broadcast',
                event: 'challenge-accept',
                payload: { fromId: myPresenceId, fromName: myUsername, roomId }
            });
            targetChannel.unsubscribe();
        }
    });

    startMatchmaking(roomId, incomingChallenge.fromId, incomingChallenge.fromName);
    setIncomingChallenge(null);
  };

  const declineChallenge = async () => {
    if (!incomingChallenge) return;
    const supabase = getSupabase();
    const targetChannel = supabase.channel(`invites:${incomingChallenge.fromId}`);
    await targetChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            targetChannel.send({
                type: 'broadcast',
                event: 'challenge-decline',
                payload: { fromId: myPresenceId, fromName: myUsername }
            });
            targetChannel.unsubscribe();
        }
    });
    setIncomingChallenge(null);
  };

  const startMatchmaking = (roomId: string, opponentId: string, opponentName: string) => {
       const supabase = getSupabase();
       const matchChannel = supabase.channel(roomId);
       
       matchChannel.on('broadcast', { event: 'level-select' }, (payload) => {
           let levelIndex = Number(payload.payload.levelIndex);
           if (isNaN(levelIndex)) levelIndex = 0;
           onLevelSelected(levelIndex);
           setMpState(s => ({ ...s, status: 'playing' }));
       });

       matchChannel.on('broadcast', { event: 'progress' }, (payload) => {
           let progress = Number(payload.payload.progress);
           if (isNaN(progress)) progress = 0;
           onOpponentProgress(progress);
           setMpState(s => s.opponent ? { ...s, opponent: { ...s.opponent, progress: progress } } : s);
       });

       matchChannel.on('broadcast', { event: 'finish' }, (payload) => {
           let time = Number(payload.payload.time);
           if (isNaN(time)) time = 0;
           onOpponentFinish(time);
           setMpState(s => {
               if(s.status === 'playing') {
                   return { ...s, status: 'gameover', opponent: s.opponent ? { ...s.opponent, time: time } : null };
               }
               return s;
           });
       });

       matchChannel.on('broadcast', { event: 'leave' }, () => {
           onOpponentLeft();
           leaveMatch();
       });

       matchChannel.on('broadcast', { event: 'rematch' }, () => {
           onRematch();
           setMpState(s => ({
               ...s,
               status: 'level-select',
               opponent: s.opponent ? { ...s.opponent, progress: 0, time: undefined } : null
           }));
       });

       matchChannel.subscribe((status) => {
           if (status === 'SUBSCRIBED') {
               setMpState({
                   status: 'level-select',
                   opponent: { presenceId: opponentId, username: opponentName, progress: 0 },
                   roomId,
                   matchChannel
               });
           }
       });
  };

  const sendLevelSelect = (levelIndex: number) => {
      if (mpState.matchChannel) {
          mpState.matchChannel.send({
              type: 'broadcast',
              event: 'level-select',
              payload: { levelIndex }
          });
          onLevelSelected(levelIndex);
          setMpState(s => ({ ...s, status: 'playing' }));
      }
  };

  const emitProgress = (progress: number) => {
      if (mpState.matchChannel && mpState.status === 'playing') {
          mpState.matchChannel.send({
              type: 'broadcast',
              event: 'progress',
              payload: { progress }
          });
      }
  };

  const emitFinish = (time: number) => {
      if (mpState.matchChannel && mpState.status === 'playing') {
          mpState.matchChannel.send({
              type: 'broadcast',
              event: 'finish',
              payload: { time }
          });
          setMpState(s => ({ ...s, status: 'victory' }));
      }
  };

  const leaveMatch = () => {
      if (mpState.matchChannel) {
          mpState.matchChannel.send({
              type: 'broadcast',
              event: 'leave',
              payload: {}
          });
          mpState.matchChannel.unsubscribe();
      }
      setMpState({ status: 'idle', opponent: null, roomId: null, matchChannel: null });
  };

  const rematch = () => {
      if (mpState.matchChannel) {
          mpState.matchChannel.send({
              type: 'broadcast',
              event: 'rematch',
              payload: {}
          });
          onRematch();
          setMpState(s => ({
              ...s,
              status: 'level-select',
              opponent: s.opponent ? { ...s.opponent, progress: 0, time: undefined } : null
          }));
      }
  };

  const cancelChallenge = () => {
      setMpState({ status: 'idle', opponent: null, roomId: null, matchChannel: null });
  };

  return {
      mpState,
      incomingChallenge,
      sendChallenge,
      acceptChallenge,
      declineChallenge,
      sendLevelSelect,
      emitProgress,
      emitFinish,
      leaveMatch,
      rematch,
      cancelChallenge
  };
}
