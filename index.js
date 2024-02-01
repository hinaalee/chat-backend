const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors"); // Import the cors middleware
const { Server } = require("socket.io");
const OneSignal = require("@onesignal/node-onesignal");

// Use cors middleware
app.use(cors({ origin: "http://localhost:8100" }));

const server = http.createServer(app);
const ONESIGNAL_APP_ID = "0f10d9d5-8078-4eda-b52f-c616a5398d0b";

const io = new Server(server, {
  cors: {
    origin: "http://localhost:8100",
    methods: ["GET", "POST"],
  },
});

// Initialize OneSignal client configuration
const app_key_provider = {
  getToken() {
    return "YjcyMWY1ZDctYzYxMy00MGYwLThkNWMtZDRmZWNiZDZiOGY5";
  },
};

const configuration = OneSignal.createConfiguration({
  authMethods: {
    app_key: {
      tokenProvider: app_key_provider,
    },
  },
});

const oneSignalClient = new OneSignal.DefaultApi(configuration);

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(
      `User with ID ${socket.id} has joined the room with ID ${data} `
    );
  });

  socket.on("send_message", async (data) => {
    // Send the message to the room
    socket.to(data.room).emit("receive_message", data);

    // Notify users in the room about the new message
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.included_segments = ["All"];
    notification.contents = {
      en: `New message from ${data.author}: ${data.message}`,
    };

    try {
      const { id } = await oneSignalClient.createNotification(notification);
      console.log(`Notification sent with ID: ${id}`);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(3001, () => {
  console.log("server running");
});
