require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const app = express();
const routes = require("./routes");
const passport = require("passport");
const initDB = require("./config/initDB");
const { sendMessage } = require("./utils/nodemailer");
//  middlewares config
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
//  setup ESJ engine
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "views", "public")));
//  init passport
require("./config/passport");
app.use(passport.initialize());
// routes
app.use(routes);
app.get("/email", (req, res) => res.render("student/emaiTest"));
app.post("/email/account", async (req, res) => {
  // Call sendMessage and get the emailStatus
  const emailStatus = await sendMessage(
    "Jakaza",
    req.body.email,
    "Testing if it works",
    "Some message"
  );

  if (emailStatus) {
    console.log("Email sent successfully.");
    res.status(201).json({
      status: true,
      message: "Test created successfully.",
      emailStatus: true,
    });
  } else {
    console.log("Failed to send email.");
    res.status(500).json({
      status: false,
      message: "Failed to send email.",
      emailStatus: false,
    });
  }
});

const server = http.createServer(app);

// const io = socketIo(server);

// io.on('connection', (socket) => {
//     console.log('A client connected');

//     socket.on('userResponse', (data) => {
//         console.log('Data received from client:', data);
//     });

//     // Handle disconnection
//     socket.on('disconnect', () => {
//         console.log('A client disconnected');
//     });
// });

app.get("/*", (req, res) => res.render("error/404"));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is up at port ${PORT}`);
});
