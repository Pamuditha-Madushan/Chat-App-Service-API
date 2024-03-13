const express = require("express");
const http = require("http");
const dotenv = require("dotenv")
const app = express();
dotenv.config();
const port = process.env.PORT || 5000
const server = http.createServer(app);
const colors = require("colors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes")
const messageRoutes = require("./routes/messageRoutes")
const imageRoutes=require("./routes/imageRoutes")
//const AWS = require('aws-sdk');

const {notFound, errorHandler} = require("./middlewares/errorMiddlewares");

app.use(express.json());

connectDB();

app.get("/check", (req, res) => {
    res.send("Api was running");
})

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/image",imageRoutes)


app.use(notFound);
app.use(errorHandler);
const listenServer =app.listen(port, console.log(`Server started on ${port}`))
const io = require("socket.io")(listenServer, {
    pingTimeout: 60000,
    cors: {
        origin: "https://mern-chat-app-e6zt.onrender.com",
        credentials: true
    },
});

io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User Joined Room: " + room);
    });
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("new message", (newMessageReceived) => {
        var chat = newMessageReceived.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id == newMessageReceived.sender._id) return;

            socket.in(user._id).emit("message received", newMessageReceived);
        });
    });

    socket.off("setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});