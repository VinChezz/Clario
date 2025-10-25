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

function addUserToRoom(socket, fileId) {
  if (!roomStates.has(fileId)) {
    roomStates.set(fileId, {
      content: null,
      canvasContent: null,
      editorContent: null,
      users: new Map(),
    });
  }

  const roomState = roomStates.get(fileId);

  const userData = {
    id: socket.userData.id,
    name: socket.userData.name,
    email: socket.userData.email,
    image: socket.userData.image,
    color: generateUserColor(socket.userData.id),
    cursor: null,
    selection: null,
    status: "VIEWING",
    lastActive: new Date().toISOString(),
  };

  roomState.users.set(socket.id, userData);

  console.log(`📍 User ${socket.userData.name} added to room ${fileId}`);
  console.log(`👥 Total users in room ${fileId}: ${roomState.users.size}`);

  return userData;
}

function ensureUserInRoom(socket, fileId) {
  if (!fileId) {
    console.log("❌ No fileId provided");
    return null;
  }

  const roomState = roomStates.get(fileId);
  if (!roomState) {
    console.log(`❌ Room ${fileId} not found, creating...`);
    return addUserToRoom(socket, fileId);
  }

  const userData = roomState.users.get(socket.id);
  if (!userData) {
    console.log(`🔄 User not in room ${fileId}, auto-adding...`);
    return addUserToRoom(socket, fileId);
  }

  return userData;
}

io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id, socket.userData.name);

  const fileIdFromQuery = socket.handshake.query.fileId;
  if (fileIdFromQuery) {
    console.log(`🚀 Auto-joining room from query: ${fileIdFromQuery}`);
    socket.join(fileIdFromQuery);
    addUserToRoom(socket, fileIdFromQuery);
  }

  socket.on("join_room", async (data) => {
    const { fileId } = data;

    if (!fileId) {
      console.log("❌ No fileId provided for join_room");
      return;
    }

    try {
      console.log(`🚀 User ${socket.userData.name} joining room: ${fileId}`);

      socket.join(fileId);

      const userData = addUserToRoom(socket, fileId);
      const roomState = roomStates.get(fileId);

      if (roomState.editorContent) {
        socket.emit("editor_content_sync", roomState.editorContent);
        console.log(
          `🔄 Sent editor content sync to ${socket.userData.name}:`,
          roomState.editorContent.blocks?.length,
          "blocks"
        );
      }

      if (roomState.canvasContent) {
        socket.emit("canvas_content_sync", roomState.canvasContent);
        console.log(
          `🎨 Sent canvas content sync to ${socket.userData.name}:`,
          roomState.canvasContent.length,
          "elements"
        );
      }

      const roomUsers = Array.from(roomState.users.values())
        .filter((u) => u.id !== socket.userData.id)
        .map((u) => ({
          user: u,
          status: u.status,
          lastActive: u.lastActive,
        }));

      console.log(
        `📊 Sending presence state with ${roomUsers.length} other users`
      );
      socket.emit("room_presence_state", roomUsers);

      socket.to(fileId).emit("user_joined_presence", {
        user: socket.userData,
        status: "VIEWING",
        lastActive: new Date().toISOString(),
      });

      console.log(
        `✅ User ${socket.userData.name} successfully joined room ${fileId}`
      );
    } catch (error) {
      console.error("❌ Error in join_room:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  function handleRoomEvent(socket, data, eventName, handler) {
    const { fileId } = data;

    if (!fileId) {
      console.log(`❌ No fileId in ${eventName}`);
      return;
    }

    const userData = ensureUserInRoom(socket, fileId);
    if (!userData) {
      console.log(`❌ Failed to ensure user in room for ${eventName}`);
      return;
    }

    handler(userData, fileId);
  }

  socket.on("canvas_content_update", (data) => {
    handleRoomEvent(
      socket,
      data,
      "canvas_content_update",
      (userData, fileId) => {
        const { content } = data;

        console.log("🎨 SERVER: canvas_content_update RECEIVED", {
          fileId,
          elements: content?.length || 0,
          from: socket.userData.name,
        });

        const roomState = roomStates.get(fileId);
        roomState.canvasContent = content;

        socket.to(fileId).emit("canvas_content_update", {
          content: content,
          user: userData,
        });
      }
    );
  });

  socket.on("canvas_cursor_update", (data) => {
    handleRoomEvent(
      socket,
      data,
      "canvas_cursor_update",
      (userData, fileId) => {
        const { cursor } = data;

        console.log("🎯 SERVER: canvas_cursor_update RECEIVED", {
          fileId,
          from: socket.userData.name,
        });

        socket.to(fileId).emit("canvas_cursor_update", {
          ...cursor,
          user: userData,
        });
      }
    );
  });

  socket.on("editor_content_update", (data) => {
    handleRoomEvent(
      socket,
      data,
      "editor_content_update",
      (userData, fileId) => {
        const { content } = data;

        console.log("🔍 SERVER: editor_content_update RECEIVED", {
          fileId,
          blocks: content?.blocks?.length,
          from: socket.userData.name,
        });

        const roomState = roomStates.get(fileId);
        roomState.editorContent = content;

        socket.to(fileId).emit("editor_content_update", {
          content: content,
          user: userData,
        });
      }
    );
  });

  socket.on("editor_cursor_update", (data) => {
    handleRoomEvent(
      socket,
      data,
      "editor_cursor_update",
      (userData, fileId) => {
        const { cursor } = data;

        console.log("🎯 SERVER: editor_cursor_update RECEIVED", {
          fileId,
          from: socket.userData.name,
        });

        socket.to(fileId).emit("editor_cursor_update", {
          ...cursor,
          user: userData,
        });
      }
    );
  });

  socket.on("typing_update", (data) => {
    handleRoomEvent(socket, data, "typing_update", (userData, fileId) => {
      try {
        console.log("⌨️ SERVER: typing_update RECEIVED", {
          fileId: data?.fileId,
          from: socket.userData.name,
          hasTyping: !!data?.typing,
        });

        if (!data.typing) {
          console.log("❌ SERVER: Invalid typing_update data structure:", data);
          return;
        }

        const { typing } = data;

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
  });

  socket.on("selection_update", (data) => {
    handleRoomEvent(socket, data, "selection_update", (userData, fileId) => {
      const { selection } = data;

      console.log("📤 Server received selection_update:", {
        fileId,
        from: socket.userData.name,
        hasSelection: !!selection?.text,
      });

      userData.selection = selection;

      const selectionWithUser = {
        ...selection,
        user: userData,
      };

      socket.to(fileId).emit("selection_update", selectionWithUser);
    });
  });

  socket.on("presence_update", (data) => {
    handleRoomEvent(socket, data, "presence_update", (userData, fileId) => {
      const { status, cursor } = data;

      console.log("🎯 Presence update received:", {
        userId: socket.userData.id,
        user: socket.userData.name,
        status,
        cursor,
      });

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
  });

  socket.on("join_comments_room", (data) => {
    const roomName = `comments:${data.fileId}`;
    socket.join(roomName);
    console.log(`📥 User ${socket.id} joined ${roomName}`);
  });

  socket.on("leave_comments_room", (data) => {
    const roomName = `comments:${data.fileId}`;
    socket.leave(roomName);
    console.log(`📤 User ${socket.id} left ${roomName}`);
  });

  socket.on("comment:create", (comment) => {
    const roomName = `comments:${comment.fileId}`;
    console.log(`💬 Broadcasting comment:create to ${roomName}`);

    io.to(roomName).emit("comment:create", comment);
  });

  socket.on("comment:update", (comment) => {
    const roomName = `comments:${comment.fileId}`;
    console.log(`✏️ Broadcasting comment:update to ${roomName}`);

    io.to(roomName).emit("comment:update", comment);
  });

  socket.on("comment:delete", (data) => {
    const roomName = `comments:${data.fileId}`;
    console.log(`🗑️ Broadcasting comment:delete to ${roomName}`);

    io.to(roomName).emit("comment:delete", data);
  });

  socket.on("comment:resolve", (data) => {
    const roomName = `comments:${data.fileId}`;
    io.to(roomName).emit("comment:resolve", data);
  });

  socket.on("reply:create", (data) => {
    console.log("📨 SERVER: Received reply:create event", {
      commentId: data.commentId,
      replyId: data.reply?.id,
      fileId: data.fileId,
      createdByUserId: data.createdByUserId,
    });

    const fileId = data.fileId;
    if (fileId) {
      const roomName = `comments:${fileId}`;

      const room = io.sockets.adapter.rooms.get(roomName);
      const roomSize = room ? room.size : 0;

      console.log(`💬 SERVER: Broadcasting reply:create to ${roomName}`, {
        roomSize,
        excludeSender: data.createdByUserId,
      });

      const broadcastData = {
        commentId: data.commentId,
        reply: data.reply,
        fileId: fileId,
        createdByUserId: data.createdByUserId,
      };

      if (data.createdByUserId) {
        socket.to(roomName).emit("reply:create", broadcastData);
        console.log("📤 SERVER: Emitting to room (excluding creator)");
      } else {
        io.to(roomName).emit("reply:create", broadcastData);
        console.log("📤 SERVER: Emitting to room (all users)");
      }

      console.log("✅ SERVER: Successfully broadcasted reply:create");
    } else {
      console.error("❌ SERVER: No fileId in reply:create event", data);
    }
  });

  socket.on("reply:delete", (data) => {
    const fileId = data.fileId;
    if (fileId) {
      const roomName = `comments:${fileId}`;
      console.log(`🗑️ Broadcasting reply:delete to ${roomName}`);

      io.to(roomName).emit("reply:delete", data);
    }
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
        console.log(`👥 Remaining users in room: ${roomState.users.size}`);

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
