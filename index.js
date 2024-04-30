require('dotenv').config();
const express = require("express");
const server = express();
const mongoose = require("mongoose");
const cors = require("cors");
server.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
  })
);
const passport = require("passport");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const JwtStrategy = require("passport-jwt").Strategy;
const cookieParser = require('cookie-parser');
const ExtractJwt = require("passport-jwt").ExtractJwt;
const { createProduct } = require("./controller/Product");
const productRouter = require("./routes/Products");
const categoriesRouter = require("./routes/Categories");
const brandsRouter = require("./routes/Brands");
const userRouter = require("./routes/Users");
const authRouter = require("./routes/Auth");
const cartRouter = require("./routes/Cart");
const orderRouter = require("./routes/Order");
const { User } = require("./model/User");
const { isAuth, sanitizeUser, cookieExtractor } = require("./services/common");
const path = require('path');

// Webhook
const endpointSecret = process.env.ENDPOINT_SECRET;

server.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});




const opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey =process.env.JWT_SECRET_KEY;

server.use(express.static(path.resolve(__dirname,'build')))
server.use(cookieParser())
server.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
  })
);

server.use(passport.authenticate("session"));

server.use(
  cors({
    exposedHeaders: ["X-Total-Count"],
  })
);
// server.use(express.raw({type:"application/json"}));
server.use(express.json());
server.use("/products", isAuth(), productRouter.router);
server.use("/categories", isAuth(), categoriesRouter.router);
server.use("/brands", isAuth(), brandsRouter.router);
server.use("/users", isAuth(), userRouter.router);
server.use("/auth", authRouter.router);
server.use("/cart", isAuth(), cartRouter.router);
server.use("/orders", isAuth(), orderRouter.router);
passport.use(
  "local",
  new LocalStrategy({usernameField:'email'},async function (email, password, done) {
    console.log(email);
    try {
      const user = await User.findOne({ email: email }).exec();
      console.log(user);
      if (!user) done(null, false, { message: "Invalid Credentials" });
      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        "sha256",
        async function (err, hashedPassword) {
            if (!crypto.timingSafeEqual(user.password, hashedPassword))
            done(null, false, { message: "Invalid Credentials" });
          const token = jwt.sign(sanitizeUser(user), process.env.JWT_SECRET_KEY);

          // done(null, {token});
          done(null, {id:user.id,role:user.role,username:user.username,token});
        }
      );
    } catch (err) {
      done(err + " hii");
    }
  })
);
passport.use(
  'jwt',
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) {
        return done(null, sanitizeUser(user)); // this calls serializer
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    // console.log(user);
    return cb(null, sanitizeUser(user));
  });
});
passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// Payments

// This is your test secret API key.
const stripe = require("stripe")(process.env.STRIPE_SERVER_KEY);


server.post("/create-payment-intent", async (req, res) => {
  const { totalAmount } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount*100,
    currency: "inr",
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
    description:"this is description"
  });
  // 4000003560000008 - test card number
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});




main().catch((e) => console.log(e));
async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("database connected");
}

server.listen(process.env.PORT, () => {
  console.log("server started");
});
