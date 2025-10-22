const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const roomStates = new Map();

async function getUserFromDatabase(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      console.log("❌ User not found in database:", userId);
      return null;
    }

    console.log("✅ User found in database:", user.name);
    return user;
  } catch (error) {
    console.error("❌ Error fetching user from database:", error);
    return null;
  }
}

async function getUserIdFromAuth(socket) {
  try {
    const userId = socket.handshake.auth.userId;
    if (userId) {
      console.log("🔑 User ID from auth:", userId);
      return userId;
    }

    const queryUserId = socket.handshake.query.userId;
    if (queryUserId) {
      console.log("🔑 User ID from query:", queryUserId);
      return queryUserId;
    }

    console.log("❌ No user ID found in handshake:", socket.handshake.auth);
    return null;
  } catch (error) {
    console.error("❌ Error getting user ID from auth:", error);
    return null;
  }
}

function generateUserColor(userId) {
  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];
  const index =
    userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
}

io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id);
  console.log("🔍 Handshake auth:", socket.handshake.auth);
  console.log("🔍 Handshake query:", socket.handshake.query);

  socket.on("join_room", async (data) => {
    const { fileId } = data;

    const userId = await getUserIdFromAuth(socket);

    if (!userId) {
      console.log("❌ No user ID found for socket:", socket.id);
      return;
    }

    const user = await getUserFromDatabase(userId);

    if (!user) {
      console.log("❌ User not found in database:", userId);
      return;
    }

    socket.join(fileId);

    if (!roomStates.has(fileId)) {
      roomStates.set(fileId, {
        content: null,
        canvasContent: null,
        users: new Map(),
      });
    }

    const roomState = roomStates.get(fileId);

    roomState.users.set(socket.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      color: generateUserColor(user.id),
      cursor: null,
      selection: null,
    });

    console.log(`📍 User ${user.name} joined room ${fileId}`);

    if (roomState.content) {
      socket.emit("content_sync", roomState.content);
      socket.emit("canvas_content_sync", roomState.canvasContent);
    }

    socket.to(fileId).emit("user_joined", {
      userId: user.id,
      user: user,
    });
  });

  socket.on("cursor_update", (data) => {
    const { fileId, cursor } = data;

    const roomState = roomStates.get(fileId);
    if (!roomState) {
      console.log("❌ Room state not found for fileId:", fileId);
      return;
    }

    const userData = roomState.users.get(socket.id);
    if (!userData) {
      console.log("❌ User data not found for socket:", socket.id);
      return;
    }

    console.log("📤 Server received cursor_update:", {
      from: userData.name,
      room: fileId,
      cursor: cursor,
    });

    userData.cursor = cursor;

    io.to(fileId).emit("cursor_update", {
      ...cursor,
      user: userData,
    });

    console.log(`📨 Server sent cursor_update to room ${fileId}`);
  });

  socket.on("canvas_content_update", (data) => {
    const { fileId, content } = data;

    const roomState = roomStates.get(fileId);
    if (!roomState) return;

    const userData = roomState.users.get(socket.id);
    if (!userData) return;

    roomState.canvasContent = content;

    socket.to(fileId).emit("canvas_content_update", {
      content: content,
      user: userData,
    });

    console.log(`⚡ FAST SERVER SEND: ${content?.length || 0} elements`);
  });

  socket.on("canvas_cursor_update", (data) => {
    const { fileId, cursor } = data;

    console.log("🎯 SERVER: canvas_cursor_update RECEIVED", {
      fileId,
      from: socket.id,
      cursor: cursor.position,
    });

    const roomState = roomStates.get(fileId);
    if (!roomState) {
      console.log("❌ SERVER: Room state not found for cursor update");
      return;
    }

    const userData = roomState.users.get(socket.id);
    if (!userData) {
      console.log("❌ SERVER: User data not found for cursor update");
      return;
    }

    console.log("✅ SERVER: Sending cursor update to room", fileId);

    socket.to(fileId).emit("canvas_cursor_update", {
      ...cursor,
      user: userData,
    });
  });

  socket.on("selection_update", (data) => {
    const { fileId, selection } = data;

    const roomState = roomStates.get(fileId);
    if (!roomState) return;

    const userData = roomState.users.get(socket.id);
    if (!userData) return;

    console.log("📤 Server received selection_update:", {
      from: userData.name,
      hasText: !!selection.text?.trim(),
      textLength: selection.text?.length || 0,
    });

    userData.selection = selection;

    const selectionWithUser = {
      ...selection,
      user: userData,
    };

    socket.to(fileId).emit("selection_update", selectionWithUser);
  });

  socket.on("typing_update", (data) => {
    const { fileId, typing } = data;

    console.log("🔍 DEBUG typing_update received:", { fileId, typing });

    const roomState = roomStates.get(fileId);
    if (!roomState) {
      console.log("❌ Room state not found for fileId:", fileId);
      return;
    }

    const userData = roomState.users.get(socket.id);
    console.log("🔍 DEBUG userData from roomState:", userData);

    if (!userData) {
      console.log("❌ User data not found for socket:", socket.id);
      console.log(
        "🔍 DEBUG All users in room:",
        Array.from(roomState.users.entries())
      );
      return;
    }

    userData.cursor = typing.position;
    userData.isTyping = typing.isTyping;

    const fullData = {
      userId: typing.userId,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        image: userData.image,
      },
      userColor: typing.userColor,
      position: typing.position,
      isTyping: typing.isTyping,
    };

    console.log("📨 DEBUG Sending full typing data:", fullData);
    console.log("🔍 DEBUG User in fullData:", fullData.user);

    socket.to(fileId).emit("typing_update", fullData);
  });

  socket.on("content_update", (data) => {
    const { fileId, content } = data;

    console.log("🔍 SERVER: content_update received", {
      fileId,
      blocks: content?.blocks?.length,
      from: socket.id,
    });

    const roomState = roomStates.get(fileId);
    if (!roomState) {
      console.log("❌ SERVER: Room state not found for content_update");
      return;
    }

    const userData = roomState.users.get(socket.id);
    console.log("🔍 SERVER: User data for content:", userData?.name);

    if (!userData) {
      console.log("❌ SERVER: User data not found for content_update");
      return;
    }

    roomState.content = content;

    const fullData = {
      content,
      user: userData,
    };

    console.log("📨 SERVER: Sending content_update to room", fileId);
    socket.to(fileId).emit("content_update", fullData);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ User disconnected:", socket.id, "Reason:", reason);

    roomStates.forEach((roomState, fileId) => {
      if (roomState.users.has(socket.id)) {
        const userData = roomState.users.get(socket.id);
        roomState.users.delete(socket.id);

        console.log(`🚪 User ${userData.name} left room ${fileId}`);

        socket.to(fileId).emit("user_left", {
          userId: userData.id,
        });
      }
    });
  });
});

const PORT = process.env.SOCKET_PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  console.log("🔄 Disconnecting Prisma...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🔄 Disconnecting Prisma...");
  await prisma.$disconnect();
  process.exit(0);
});
