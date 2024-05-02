const express = require("express");
const { loginUser, createUser, checkAuth, resetPasswordRequest, resetPassword, logout } = require("../controller/Auth");
const router = express.Router();
const passport = require("passport");
router
  .post("/login", passport.authenticate("local"), loginUser)
  .post("/signup", createUser)
  .get("/logout", logout)
  .get('/check', passport.authenticate("jwt"),checkAuth)
  .post('/reset-password-request',resetPasswordRequest)
  .post('/reset-password',resetPassword)
exports.router = router;
