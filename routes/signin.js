// user for testing :
//username : zhb, pwd: zhb
//username : irene, pwd: irene

var session = require("express-session");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const ExtractJwt = require("passport-jwt").ExtractJwt;
const Strategy = require("passport-jwt").Strategy;

const ModelLogin = require("../model/login");

const passport = require("passport");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var session = require("express-session");

//define strategy
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: "secret",
};

passport.use(
  new Strategy(opts, async (payload, done) => {
    try {
      const user = ModelLogin.findById(payload.id);
      if (user) return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

router.use(
  session({
    // It holds the secret key for session
    secret: "Your_Secret_Key",

    // Forces the session to be saved
    // back to the session store
    resave: true,

    // Forces a session that is "uninitialized"
    // to be saved to the store
    saveUninitialized: true,
  })
);

router.use(express.json());
router.use(express.urlencoded({ extended: false })); //to accept req.body

router.get("/signin", (req, res) => {
  res.render("signin", { page: "signin", message: "" });
});

router.post("/signin/password", async (req, res, next) => {
  if (req.session.name != null) {
    req.session.destroy(function (error) {
      res.status(400).render("signin", {
        page: "signin",
        message: "Username does not exist",
      });
    });
  }
  try {
    //check if user exists
    const userExists = await ModelLogin.findOne({
      username: req.body.username,
    });
    if (!userExists)
      return res.status(400).render("signin", {
        page: "signin",
        message: "Username does not exist",
      });

    // check if password is correct
    var password = req.body.password;
    var getHashedPassword = userExists.hashedpassword;
    var getSalt = userExists.salt;
    crypto.pbkdf2(
      password,
      getSalt,
      310000,
      32,
      "sha256",
      function (err, hashedPassword) {
        var newHashedPassword = hashedPassword.toString("hex");
        if (err) {
          console.log(err);
        }
        if (getHashedPassword == newHashedPassword) {
          req.session.name = userExists.username;
          // generate access token
          const accessToken = jwt.sign(
            {
              id: userExists._id,
            },
            "secret",
            { expiresIn: "1d" }
          );

          res.render("home", { page: "signin", message: req.session.name });
        } else {
          res.render("signin", { page: "signin", message: "Signin Fail" });
        }
      }
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
});
module.exports = router;
