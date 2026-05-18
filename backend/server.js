const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Backend Running 🚀");
});

 app.post("/chat", (req, res) => {
  const userMessage = req.body.message;

  res.json({
    reply: "You said: " + userMessage,
  });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});