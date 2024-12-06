//fitness-workout-tracker

require("dotenv").config(); //connect to .env

const express = require("express");
const mongoose = require("mongoose");

const app = express();
const port = 3000;
const path = require("path");

//connect to database
//-----------------------------------------------------------------------------
const mongoString = process.env.DATABASE_URL;
mongoose.connect(mongoString); //connect to mongodb via connection string
const database = mongoose.connection; //instance database

database.on("error", (error) => {
  console.log(error);
});

database.once("connected", () => {
  console.log("Database Connected");
});
//---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("views", path.resolve(__dirname, "views"));
app.use(express.static(path.join(__dirname,"public/images")));
app.use(express.static(path.join(__dirname, "")));
app.set("view engine", "ejs"); //declare that using ejs

var signinRoute = require("../routes/signin");
var signupRoute = require("../routes/signup");
var signoutRoute = require("../routes/signout");
var homeRoute = require("../routes/home");
var navbarRoute = require("../routes/navbar");
var aboutRoute = require("../routes/about");
var recipePostRoute = require("../routes/recipehandler");
// var exerciseViewEditRoute = require("./routes/exerciseviewedit");
// var exerciseEditRoute = require("./routes/exerciseedit");
// var workoutEntryRoute = require("./routes/workoutentry");
// var workoutViewEditRoute = require("./routes/workoutviewedit");
// var workoutEditRoute = require("./routes/workoutedit");
// var reportRoute = require("./routes/report");

app.use("/", signinRoute);
app.use("/", signupRoute);
app.use("/", signoutRoute);
app.use("/", homeRoute);
app.use("/", navbarRoute);
app.use("/", aboutRoute);
app.use("/", recipePostRoute);
// app.use("/", exerciseViewEditRoute);
// app.use("/", exerciseEditRoute);
// app.use("/", workoutEntryRoute);
// app.use("/", workoutViewEditRoute);
// app.use("/", workoutEditRoute);
// app.use("/", reportRoute);


//---------------------------------------------------------------------------------------
//create server
app.listen(port, () => {
  console.log(`Server ready at port ${port}`);
});
module.exports = app;
