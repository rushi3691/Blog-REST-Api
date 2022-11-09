require("dotenv").config();
const morgan = require("morgan");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

// Routes
const homeRoute = require("./routes/homeRoute");
const blogRoute = require("./routes/blogRoute");
const authRoute = require("./routes/authRoute");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }, { useUnifiedTopology: true }));

app.use(morgan("dev"));
// Routes
app.use("/", homeRoute);
app.use("/blogs", blogRoute);
app.use("/user", authRoute);

// DB Configuration
mongoose.connect(
    process.env.DB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
    () => console.log("Connected to database.")

);

// Express server Bootup
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log("Server address:", `https://localhost:${PORT}`);
});
