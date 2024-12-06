const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var session = require("express-session");
const router = express.Router();
const ExtractJwt = require("passport-jwt").ExtractJwt;
const Strategy = require("passport-jwt").Strategy;

const ModelLogin = require("../model/login");

//function to save new user
async function registerLogin(
  firstname,
  lastname,
  username,
  hashedpassword,
  salt
) {
  const data = new ModelLogin({
    firstname: firstname,
    lastname: lastname,
    username: username,
    hashedpassword: hashedpassword,
    salt: salt,
  });
  try {
    const dataToSave = await data.save();
  } catch (error) {
    console.log({ message: error.message });
  }
}

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

router.get("/signup", async (req, res) => {
  res.render("signup", { page: "home", message: "" });
});

router.post("/signup", async (req, res, next) => {
  try {
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;

    var username = req.body.username;
    var password = req.body.password;
    var salt = crypto.randomBytes(16).toString("hex");
    //create hashedpassword
    crypto.pbkdf2(
      password,
      salt,
      310000,
      32,
      "sha256",
      function (err, hashedPassword) {
        if (err) {
          res.json({ message: "Fail signup user" });
        }
        hashedpassword = hashedPassword.toString("hex");
        registerLogin(firstname, lastname, username, hashedpassword, salt);
      }
    );
    res
      .status(200)
      .render("signup", { page: "home", message: "Signup success!" });
  } catch (error) {
    console.log(error);
    res.status(200).render("signup", { page: "home", message: error });
  }
});

module.exports = router;
