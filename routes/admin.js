// dependencies
const router = require("express").Router();
const fs = require("fs");

// routes
router.get("/", (req, res) => {
  res.render("admin.ejs");
});

// export router
module.exports = router;