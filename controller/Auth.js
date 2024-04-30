const { User } = require("../model/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sanitizeUser } = require("../services/common");
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
            .json({id:doc.id,role:doc.role,username:doc.username});
        });
      }
    );
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.loginUser = async (req, res) => {
  // console.log("inside login user    "+req.user.token);
  // console.log(req.user);
  const user=req.user;
  res
    .cookie("jwt",user.token, {
      expires: new Date(Date.now() + 36000000),
      httpOnly: true,
    })
    .status(201)
    .json({id:user.id,role:user.role});
};
exports.checkAuth = async (req, res) => {
  // console.log("inside check auth");
  // console.log(req.user);
  if(req.user)
  res.json(req.user);
  else
  res.status(400)
};
