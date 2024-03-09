// dependencies
const express = require("express");
const path = require("path");
require("dotenv").config();

// create app
const app = express();

// app setup
app.set("view-engine", "ejs");

app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routers
const mainRouter = require("./routes/main");
const adminRouter = require("./routes/admin");
const apiRouter = require("./routes/api");

app.use("/", mainRouter);
app.use("/admin", adminRouter);
app.use("/api", apiRouter);

// 404 page
app.use((req, res) => {
  res.render("404.ejs");
});

// database setup
const port = process.env.PORT || 3001;

// init app
app.listen(port, () => console.log(`Server listening on port ${port}.`));
