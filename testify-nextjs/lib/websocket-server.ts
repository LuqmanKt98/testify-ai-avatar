import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || undefined,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join session room
    socket.on('join-session', (sessionId: string) => {
      socket.join(`session-${sessionId}`);
      console.log(`Client ${socket.id} joined session ${sessionId}`);
    });

    // Leave session room
    socket.on('leave-session', (sessionId: string) => {
      socket.leave(`session-${sessionId}`);
      console.log(`Client ${socket.id} left session ${sessionId}`);
    });

    // Handle transcript updates
    socket.on('transcript-update', (data: { sessionId: string; entry: any }) => {
      io?.to(`session-${data.sessionId}`).emit('transcript-updated', data.entry);
    });

    // Handle avatar speaking
    socket.on('avatar-speaking', (data: { sessionId: string; speaking: boolean }) => {
      io?.to(`session-${data.sessionId}`).emit('avatar-state-changed', {
        speaking: data.speaking,
      });
    });

    // Handle user speaking
    socket.on('user-speaking', (data: { sessionId: string; speaking: boolean }) => {
      io?.to(`session-${data.sessionId}`).emit('user-state-changed', {
        speaking: data.speaking,
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export function emitToSession(sessionId: string, event: string, data: any) {
  if (io) {
    io.to(`session-${sessionId}`).emit(event, data);
  }
}

