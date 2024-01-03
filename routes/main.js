// dependencies
const router = require("express").Router();

// routes
router.get("/", (req, res) => {
  res.render("home.ejs");
});

router.get("/gallery", (req, res) => {
  res.render("gallery.ejs");
});

router.get("/unsubscribe/:email", (req, res) => {
  res.render("unsubscribe.ejs");
});

router.get("/house-rules", (req, res) => {
  res.render("houseRules.ejs");
});

router.get("/artists", (req, res) => {
  res.render("artists.ejs");
});

router.get("/shows", (req, res) => {
  res.render("shows.ejs");
});

// export router
module.exports = router;