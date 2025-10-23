const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
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

io.use(async (socket, next) => {
  try {
    const userId = await getUserIdFromAuth(socket);

    if (!userId) {
      console.log("❌ Authentication failed: no userId");
      return next(new Error("Authentication error: no userId"));
    }

    const user = await getUserFromDatabase(userId);
    if (!user) {
      console.log("❌ Authentication failed: user not found");
      return next(new Error("Authentication error: user not found"));
    }

    socket.userId = user.id;
    socket.userData = user;

    console.log("✅ Authenticated user:", user.name);
    next();
  } catch (error) {
    console.error("❌ Authentication error:", error);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id, socket.userData.name);

  socket.on("join_room", async (data) => {
    const { fileId } = data;

    if (!fileId) {
      console.log("❌ No fileId provided for join_room");
      return;
    }

    try {
      socket.join(fileId);

      if (!roomStates.has(fileId)) {
        roomStates.set(fileId, {
          content: null,
          canvasContent: null,
          editorContent: null,
          users: new Map(),
        });
      }

      if (roomState.editorContent) {
        socket.emit("editor_content_sync", roomState.editorContent);
        console.log(
          `🔄 Sent editor content sync to ${user.name}:`,
          roomState.editorContent.blocks?.length,
          "blocks"
        );
      }

      const roomState = roomStates.get(fileId);

      roomState.users.set(socket.id, {
        id: socket.userData.id,
        name: socket.userData.name,
        email: socket.userData.email,
        image: socket.userData.image,
        color: generateUserColor(socket.userData.id),
        cursor: null,
        selection: null,
        status: "VIEWING",
        lastActive: new Date().toISOString(),
      });

      console.log(
        `📍 User ${socket.userData.name} joined room ${fileId} as VIEWING`
      );

      const roomUsers = Array.from(roomState.users.values())
        .filter((u) => u.id !== user.id)
        .map((u) => ({
          user: u,
          status: u.status,
          lastActive: u.lastActive,
        }));

      socket.emit("room_presence_state", roomUsers);

      socket.to(fileId).emit("user_joined_presence", {
        user: socket.userData,
        status: "VIEWING",
        lastActive: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error in join_room:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("canvas_content_update", (data) => {
    const { fileId, content } = data;

    console.log("🎨 SERVER: canvas_content_update RECEIVED", {
      fileId,
      elements: content?.length || 0,
      from: socket.userData.name,
    });

    const roomState = roomStates.get(fileId);
    if (!roomState) {
      console.log("❌ SERVER: Room state not found for canvas_content_update");
      return;
    }

    const userData = roomState.users.get(socket.id);
    if (!userData) {
      console.log("❌ SERVER: User data not found for canvas_content_update");
      return;
    }

    roomState.canvasContent = content;

    socket.to(fileId).emit("canvas_content_update", {
      content: content,
      user: userData,
    });
  });

  socket.on("canvas_cursor_update", (data) => {
    const { fileId, cursor } = data;

    console.log("🎯 SERVER: canvas_cursor_update RECEIVED", {
      fileId,
      from: socket.userData.name,
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

    socket.to(fileId).emit("canvas_cursor_update", {
      ...cursor,
      user: userData,
    });
  });

  socket.on("editor_content_update", (data) => {
    const { fileId, content } = data;

    console.log("🔍 SERVER: editor_content_update RECEIVED", {
      fileId,
      blocks: content?.blocks?.length,
      from: socket.userData.name,
    });

    const roomState = roomStates.get(fileId);
    if (!roomState) {
      console.log("❌ SERVER: Room state not found for editor_content_update");
      return;
    }

    const userData = roomState.users.get(socket.id);
    if (!userData) {
      console.log("❌ SERVER: User data not found for editor_content_update");
      return;
    }

    roomState.editorContent = content;

    socket.to(fileId).emit("editor_content_update", {
      content: content,
      user: userData,
    });
  });

  socket.on("editor_cursor_update", (data) => {
    const { fileId, cursor } = data;

    console.log("🎯 SERVER: editor_cursor_update RECEIVED", {
      fileId,
      from: socket.userData.name,
    });

    const roomState = roomStates.get(fileId);
    if (!roomState) {
      console.log("❌ SERVER: Room state not found for editor cursor update");
      return;
    }

    const userData = roomState.users.get(socket.id);
    if (!userData) {
      console.log("❌ SERVER: User data not found for editor cursor update");
      return;
    }

    socket.to(fileId).emit("editor_cursor_update", {
      ...cursor,
      user: userData,
    });
  });

  socket.on("typing_update", (data) => {
    try {
      console.log("⌨️ SERVER: typing_update RECEIVED", {
        fileId: data?.fileId,
        from: socket.userData.name,
        hasTyping: !!data?.typing,
      });

      if (!data || !data.fileId || !data.typing) {
        console.log("❌ SERVER: Invalid typing_update data structure:", data);
        return;
      }

      const { fileId, typing } = data;

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

      const fullData = {
        userId: typing.userId || userData.id,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
        },
        userColor: typing.userColor || userData.color,
        position: typing.position || { x: 0, y: 0 },
        isTyping: Boolean(typing.isTyping),
        isActive: typing.isActive !== undefined ? typing.isActive : true,
      };

      socket.to(fileId).emit("typing_update", fullData);
    } catch (error) {
      console.error("💥 SERVER: Error in typing_update handler:", error);
    }
  });

  socket.on("selection_update", (data) => {
    const { fileId, selection } = data;

    console.log("📤 Server received selection_update:", {
      fileId,
      from: socket.userData.name,
      hasSelection: !!selection?.text,
    });

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

    userData.selection = selection;

    const selectionWithUser = {
      ...selection,
      user: userData,
    };

    socket.to(fileId).emit("selection_update", selectionWithUser);
  });

  socket.on("presence_update", (data) => {
    const { fileId, status, cursor } = data;

    console.log("🎯 Presence update received:", {
      userId: socket.userData.id,
      user: socket.userData.name,
      status,
      cursor,
    });

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

    userData.status = status || "VIEWING";
    userData.lastActive = new Date().toISOString();

    if (cursor) {
      userData.cursor = cursor;
    }

    console.log(`🔄 Updating presence for ${userData.name}: ${status}`);

    socket.to(fileId).emit("presence_updated", {
      user: userData,
      status: status,
      lastActive: userData.lastActive,
      cursor: cursor,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(
      "❌ User disconnected:",
      socket.id,
      "Reason:",
      reason,
      "User:",
      socket.userData.name
    );

    roomStates.forEach((roomState, fileId) => {
      if (roomState.users.has(socket.id)) {
        const userData = roomState.users.get(socket.id);
        roomState.users.delete(socket.id);

        console.log(`🚪 User ${userData.name} left room ${fileId}`);

        socket.to(fileId).emit("user_left_presence", {
          userId: userData.id,
        });

        if (roomState.users.size === 0) {
          roomStates.delete(fileId);
          console.log(`🧹 Room ${fileId} cleaned up (no users)`);
        }
      }
    });
  });

  socket.on("error", (error) => {
    console.error("💥 Socket error:", error);
  });
});

const PORT = process.env.SOCKET_PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`🔧 Transports: websocket, polling`);
  console.log(
    `🌐 CORS enabled for: localhost:3000, 127.0.0.1:3000, localhost:3001`
  );
});
