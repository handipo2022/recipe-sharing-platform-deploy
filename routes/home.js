const express = require("express");
const router = express.Router();
const path = require('path');
router.get("/home", (req, res) => {
  req.session.destroy(function (err) {
    res.render("home", { page: "home", message: "" });
  });

});
module.exports = router;
