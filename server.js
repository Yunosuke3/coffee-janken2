// ============================================================
// ファミマじゃんけん 3D サーバー
// キャラクター選択対応版 (bear / rabbit / cat)
// ============================================================

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};
const CHOICES = ['rock', 'paper', 'scissors'];
const CHARACTERS = ['bear', 'rabbit', 'cat'];

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  } while (rooms[code]);
  return code;
}

function validateCharacter(ch) {
  return CHARACTERS.includes(ch) ? ch : 'bear';
}

function roomSnapshot(roomCode, revealChoices = false) {
  const room = rooms[roomCode];
  if (!room) return null;
  const players = Object.entries(room.players).map(([id, p]) => ({
    id,
    name: p.name,
    character: p.character,
    alive: p.alive,
    hasChosen: p.choice !== null,
    choice: revealChoices ? p.choice : null,
    isHost: id === room.hostId,
    slot: p.slot,
  }));
  return { roomCode, phase: room.phase, round: room.round, hostId: room.hostId, players };
}

function broadcastRoom(roomCode, reveal = false) {
  const snap = roomSnapshot(roomCode, reveal);
  if (snap) io.to(roomCode).emit('room:update', snap);
}

function allAliveChose(room) {
  const alive = Object.values(room.players).filter(p => p.alive);
  return alive.length > 0 && alive.every(p => p.choice !== null);
}

function judgeRound(room) {
  const alive = Object.entries(room.players).filter(([, p]) => p.alive);
  const choices = alive.map(([, p]) => p.choice);
  const set = new Set(choices);
  if (set.size === 1 || set.size === 3) return { kind: 'tie' };
  const [a, b] = [...set];
  const beats = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
  let winChoice, loseChoice;
  if (beats[a] === b) { winChoice = a; loseChoice = b; }
  else { winChoice = b; loseChoice = a; }
  const winners = alive.filter(([, p]) => p.choice === winChoice).map(([id]) => id);
  const losers = alive.filter(([, p]) => p.choice === loseChoice).map(([id]) => id);
  return { kind: 'advance', winners, losers, winChoice, loseChoice };
}

function resetChoices(room) {
  for (const p of Object.values(room.players)) if (p.alive) p.choice = null;
}

function nextSlot(room) {
  const used = new Set(Object.values(room.players).map(p => p.slot));
  for (let i = 0; i < 20; i++) if (!used.has(i)) return i;
  return 0;
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ name, character }, cb) => {
    name = String(name || '').trim().slice(0, 20) || 'プレイヤー';
    character = validateCharacter(character);
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      hostId: socket.id,
      phase: 'lobby',
      round: 0,
      players: { [socket.id]: { name, character, alive: true, choice: null, slot: 0 } },
    };
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    cb && cb({ ok: true, roomCode });
    broadcastRoom(roomCode);
  });

  socket.on('room:join', ({ name, character, roomCode }, cb) => {
    name = String(name || '').trim().slice(0, 20) || 'プレイヤー';
    character = validateCharacter(character);
    roomCode = String(roomCode || '').trim().toUpperCase();
    const room = rooms[roomCode];
    if (!room) return cb && cb({ ok: false, error: 'ルームが見つかりません' });
    if (room.phase !== 'lobby') return cb && cb({ ok: false, error: 'すでにゲームが始まっています' });
    if (Object.keys(room.players).length >= 10) return cb && cb({ ok: false, error: 'ルームが満員です' });
    room.players[socket.id] = { name, character, alive: true, choice: null, slot: nextSlot(room) };
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    cb && cb({ ok: true, roomCode });
    broadcastRoom(roomCode);
  });

  socket.on('game:start', () => {
    const rc = socket.data.roomCode;
    const room = rooms[rc];
    if (!room || room.hostId !== socket.id) return;
    if (Object.keys(room.players).length < 2) return;
    room.phase = 'playing';
    room.round = 1;
    for (const p of Object.values(room.players)) { p.alive = true; p.choice = null; }
    broadcastRoom(rc);
  });

  socket.on('game:choose', ({ choice }) => {
    const rc = socket.data.roomCode;
    const room = rooms[rc];
    if (!room || room.phase !== 'playing') return;
    const me = room.players[socket.id];
    if (!me || !me.alive) return;
    if (!CHOICES.includes(choice)) return;
    me.choice = choice;
    broadcastRoom(rc);

    if (allAliveChose(room)) {
      const result = judgeRound(room);
      setTimeout(() => {
        if (result.kind === 'tie') {
          io.to(rc).emit('round:result', { kind: 'tie', round: room.round });
          broadcastRoom(rc, true);
          setTimeout(() => {
            resetChoices(room);
            broadcastRoom(rc);
          }, 1800);
        } else {
          broadcastRoom(rc, true);
          setTimeout(() => {
            for (const id of result.losers) if (room.players[id]) room.players[id].alive = false;
            io.to(rc).emit('round:result', {
              kind: 'advance', round: room.round,
              winners: result.winners, losers: result.losers,
              winChoice: result.winChoice, loseChoice: result.loseChoice,
            });
            const aliveIds = Object.entries(room.players).filter(([, p]) => p.alive).map(([id]) => id);
            if (aliveIds.length === 1) {
              room.phase = 'finished';
              const loserId = aliveIds[0];
              const loserName = room.players[loserId].name;
              const loserCharacter = room.players[loserId].character;
              io.to(rc).emit('game:over', {
                loserId, loserName, loserCharacter,
                everyone: Object.entries(room.players).map(([id, p]) => ({ id, name: p.name })),
              });
              broadcastRoom(rc, true);
            } else {
              room.round += 1;
              resetChoices(room);
              broadcastRoom(rc);
            }
          }, 1800);
        }
      }, 600);
    }
  });

  socket.on('game:restart', () => {
    const rc = socket.data.roomCode;
    const room = rooms[rc];
    if (!room || room.hostId !== socket.id) return;
    room.phase = 'lobby';
    room.round = 0;
    for (const p of Object.values(room.players)) { p.alive = true; p.choice = null; }
    broadcastRoom(rc);
  });

  socket.on('disconnect', () => {
    const rc = socket.data.roomCode;
    if (!rc) return;
    const room = rooms[rc];
    if (!room) return;
    delete room.players[socket.id];
    if (Object.keys(room.players).length === 0) { delete rooms[rc]; return; }
    if (room.hostId === socket.id) room.hostId = Object.keys(room.players)[0];
    if (room.phase === 'playing' && allAliveChose(room)) resetChoices(room);
    if (room.phase === 'playing' && Object.values(room.players).filter(p => p.alive).length <= 1) {
      room.phase = 'lobby'; room.round = 0;
      for (const p of Object.values(room.players)) { p.alive = true; p.choice = null; }
    }
    broadcastRoom(rc);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🟢🔵 Famima Janken 3D server on http://localhost:${PORT}`);
});
