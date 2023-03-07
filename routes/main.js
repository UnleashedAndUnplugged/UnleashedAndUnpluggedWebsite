// dependencies
const router = require("express").Router();

// routes
router.get("/", (req, res) => {
  res.render("home.ejs");
});

// export router
module.exports = router;