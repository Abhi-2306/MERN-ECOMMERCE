const { User } = require("../model/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sanitizeUser, sendMail } = require("../services/common");
exports.createUser = async (req, res) => {
  try {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async function (err, hashedPassword) {
        const user = new User({ ...req.body, password: hashedPassword, salt });
        const doc = await user.save();
        req.login(sanitizeUser(doc), (err) => {
          if (err) res.status(400).json(err);
          const token = jwt.sign(sanitizeUser(doc), process.env.JWT_SECRET_KEY);
          res
            .cookie("jwt", token, {
              expires: new Date(Date.now() + 3600000),
              httpOnly: true,
            })
            .status(201)
            .json({ id: doc.id, role: doc.role, username: doc.username });
        });
      }
    );
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.loginUser = async (req, res) => {
  const user = req.user;
  res
    .cookie("jwt", user.token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true,
    })
    .status(201)
    .json({ id: user.id, role: user.role, username:user.username });
};

exports.logout = async (req, res) => {
  res
    .cookie("jwt", null, {
      expires: new Date(0),
      httpOnly: true,
    })
    .sendStatus(200);
};

exports.checkAuth = async (req, res) => {
  if (req.user) res.json(req.user);
  else res.status(400);
};

exports.resetPasswordRequest = async (req, res) => {
  const email = req.body.email.email;
  const user = await User.findOne({ email: email });
  if (user) {
    const token = crypto.randomBytes(48).toString("hex");
    user.resetPasswordToken = token;
    await user.save();
    const resetPageLink =
      "https://mern-ecommerce-three-xi.vercel.app/reset-password?token=" + token + "&email=" + email;
    const subject = "Reset password for E-Commerce";
    const html = `<p>Click <a href='${resetPageLink}'>here</a> to reset password</p>`;
    if (email) {
      const response = await sendMail({
        to: email,
        subject,
        html,
      });
      res.json(response);
    } else res.status(400);
  } else {
    res.status(400);
  }
};

exports.resetPassword = async (req, res) => {
  const { email, token, password } = req.body.data;
  const user = await User.findOne({ email: email, resetPasswordToken: token });
  if (user) {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      password,
      salt,
      310000,
      32,
      "sha256",
      async function (err, hashedPassword) {
        user.password = hashedPassword;
        user.salt = salt;
        await user.save();
        const subject = "Password reset successful";
        const html = `<p>Your password is successfully changed</p>`;
        if (email) {
          const response = await sendMail({
            to: email,
            subject,
            html,
          });
          res.json(response);
        } else res.status(400);
      }
    );
  } else {
    res.status(400);
  }
};
