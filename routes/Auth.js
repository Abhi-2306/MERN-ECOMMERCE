const express = require("express");
const { loginUser, createUser, checkAuth } = require("../controller/Auth");
const router = express.Router();
const passport = require("passport");
router
  .post("/login", passport.authenticate("local"), loginUser)
  .post("/signup", createUser)
  .get('/check', passport.authenticate("jwt"),checkAuth)
exports.router = router;
