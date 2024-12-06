const express = require("express");
const mongoose = require("mongoose");
const Recipe = require("../model/recipe");
const Login = require("../model/login");
const router = express.Router();
const fs = require("fs/promises");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });

var start_page = 0;
var end_page = 1;
var current_page = "/recipelist";
var page_now = 0;
var arrayObj = [];

//----------------------------------------------------------------------------------------------------------------------
//recipe view handler
router.get(current_page + "/viewrow", async (req, res) => {
  var rowindex = req.query.rowindex;
  var rowinpage = req.query.rowpage; //get url parameter
  current_rowinpage = rowinpage;
  var pos_page = req.query.page;
  var id = req.query.id;
  try {
    
    const recipeView = await Recipe.aggregate([
      {
        $project: {
          username: 1,
          recipes: {
            $filter: {
              input: "$recipes",
              as: "recipe",
              cond: {
                $eq: ["$$recipe._id", new mongoose.Types.ObjectId(id)],
              },
            },
          },
        },
      },
    ]);
    for await (const recipe of recipeView) {
      if (recipe.recipes.length > 0) {
        arrayObj.push({
          title: recipe.recipes[0].title,
          postdate: recipe.recipes[0].publish,
          description: recipe.recipes[0].description,
          photo: recipe.recipes[0].photo.data,
          contenttype: recipe.recipes[0].photo.contentType,
        });
      }
    }

    res.render("recipeview", {
      page: "recipeview",
      message: req.session.name,
      titlepage: `Recipe View`,
      titleRecipe: arrayObj[0].title,
      postDateRecipe: arrayObj[0].postdate,
      descriptionRecipe: arrayObj[0].description,
      imgData: arrayObj[0].photo.toString("base64"),
      imgContentType: arrayObj[0].contenttype,
    });
  } catch (err) {
    console.log(err);
    res.render("error", { page: "error", message: req.session.name });
  }
  arrayObj.length = 0;
});

//------------------------------------------------------------------------------------------------------------------------
//recipelist handler

router.get("/recipelist", async (req, res) => {
  var rowinpage = req.query.rowpage; //get url parameter
  current_rowinpage = rowinpage;
  try {
    const recipeList = await Recipe.find({});
    for await (const recipe of recipeList) {
      for await (const item of recipe.recipes) {
        const chefName = await Login.findOne({ username: recipe.username });
        arrayObj.push({
          id: item._id,
          title: item.title,
          chef: `${chefName.firstname} ${chefName.lastname} `,
          postdate: item.publish,
        });
      }
    }

    let temp = start_page + parseInt(current_rowinpage);
    if (temp <= arrayObj.length) {
      end_page = start_page + parseInt(current_rowinpage);
    }
    if (temp > arrayObj.length) {
      end_page = arrayObj.length;
    }
    res.render("recipelist", {
      page: "recipelist", //user session
      message: req.session.name,
      currentpage: current_page,
      startpage: start_page,
      endpage: end_page,
      viewresult: arrayObj, //array object contain data from dbase
      titlepage: "Recipes List", //title page
      rowinpage: current_rowinpage, //shown row in page
      keys: ["title", "chef", "postdate"],
      tableheader: ["#", "Title", "Chef", "Post date", "View"], //header displayed
      links: [
        { row: "5", url: "/recipelist/?rowpage=5" },
        { row: "10", url: "/recipelist/?rowpage=10" },
        { row: "15", url: "/recipelist/?rowpage=15" },
        { row: "20", url: "/recipelist/?rowpage=20" },
        { row: "25", url: "/recipelist/?rowpage=25" },
      ],
      pagenow: page_now,
    });
  } catch (err) {
    res.render("error", {
      page: "error", //user session
      message: req.session.name,
      error: err,
    });
  }
  arrayObj.length = 0;
});

router.get("/recipelist/gotopage", async (req, res) => {
  try {
    const recipeList = await Recipe.find({});
    for await (const recipe of recipeList) {
      for await (const item of recipe.recipes) {
        const chefName = await Login.findOne({ username: recipe.username });
        arrayObj.push({
          id: item._id,
          title: item.title,
          chef: `${chefName.firstname} ${chefName.lastname} `,
          postdate: item.publish,
        });
      }
    }

    let num_pages = arrayObj.length / current_rowinpage;
    if (arrayObj.length % current_rowinpage != 0) {
      num_pages += 1;
    }
    page_now = parseInt(req.query.page);
    if (page_now < 1) {
      page_now += 1;
    }
    if (page_now > num_pages) {
      page_now -= 1;
    }
    start_page = (page_now - 1) * parseInt(current_rowinpage);

    let temp = start_page + parseInt(current_rowinpage);
    if (temp <= arrayObj.length) {
      end_page = start_page + parseInt(current_rowinpage);
    }
    if (temp > arrayObj.length) {
      end_page = arrayObj.length;
    }

    res.render("recipelist", {
      page: "recipelist", //user session
      message: req.session.name,
      currentpage: current_page,
      startpage: start_page,
      endpage: end_page,
      viewresult: arrayObj, //array object contain data from dbase
      titlepage: "Recipes List", //title page
      rowinpage: current_rowinpage, //shown row in page
      keys: ["title", "chef", "postdate"],
      tableheader: ["#", "Title", "Chef", "Post date", "View"], //header displayed
      links: [
        { row: "5", url: "/recipelist/?rowpage=5" },
        { row: "10", url: "/recipelist/?rowpage=10" },
        { row: "15", url: "/recipelist/?rowpage=15" },
        { row: "20", url: "/recipelist/?rowpage=20" },
        { row: "25", url: "/recipelist/?rowpage=25" },
      ],
      pagenow: page_now,
    });
  } catch (err) {
    res.render("error", {
      page: "error", //user session
      message: req.session.name,
      error: err,
    });
  }
  arrayObj.length = 0;
});

router.post("/recipelist/", async (req, res) => {
  var rowinpage = req.query.rowpage;
  current_rowinpage = rowinpage;
  var filterBy = req.query.filterby;
  var searchValue = req.query.searchvalue;

  //filter by Post date
  if (filterBy == "postdate") {
    try {
      const recipeListFilteredByPostDate = await Recipe.aggregate([
        {
          $project: {
            username: 1,
            recipes: {
              $filter: {
                input: "$recipes",
                as: "recipe",
                cond: {
                  $eq: ["$$recipe.publish", new Date(searchValue)],
                },
              },
            },
          },
        },
      ]);

      for await (const recipe of recipeListFilteredByPostDate) {
        const chefName = await Login.findOne({ username: recipe.username });
        if (recipe.recipes.length > 0) {
          for await (const item of recipe.recipes) {
            arrayObj.push({
              id: item._id,
              title: item.title,
              chef: `${chefName.firstname} ${chefName.lastname} `,
              postdate: item.publish,
            });
          }
        }
      }

      let temp = start_page + parseInt(current_rowinpage);
      if (temp <= arrayObj.length) {
        end_page = start_page + parseInt(current_rowinpage);
      }
      if (temp > arrayObj.length) {
        end_page = arrayObj.length;
      }
      res.render("recipelist", {
        page: "recipelist", //user session
        message: req.session.name,
        currentpage: current_page,
        startpage: start_page,
        endpage: end_page,
        viewresult: arrayObj, //array object contain data from dbase
        titlepage: "Recipes List", //title page
        rowinpage: current_rowinpage, //shown row in page
        keys: ["title", "chef", "postdate"],
        tableheader: ["#", "Title", "Chef", "Post date", "View"], //header displayed
        links: [
          { row: "5", url: "/recipelist/?rowpage=5" },
          { row: "10", url: "/recipelist/?rowpage=10" },
          { row: "15", url: "/recipelist/?rowpage=15" },
          { row: "20", url: "/recipelist/?rowpage=20" },
          { row: "25", url: "/recipelist/?rowpage=25" },
        ],
        pagenow: page_now,
      });
    } catch (err) {
      res.render("error", {
        page: "error", //user session
        message: req.session.name,
        error: err,
      });
    }
    arrayObj.length = 0;
  }

  //filter by Chef
  if (filterBy == "chefname") {
    const regex = new RegExp(searchValue, "i"); //regex pattern and in-casesensitive
    try {
      const chefLogin = await Login.find({
        //find username with match pattern
        $or: [
          {
            firstname: {
              $regex: regex,
            },
          },
          {
            lastname: {
              $regex: regex,
            },
          },
        ],
      });

      for await (const itemChefLogin of chefLogin) {
        const recipesList = await Recipe.find({
          //find all recipe docs match with username
          username: itemChefLogin.username,
        });
        for await (const recipe of recipesList) {
          //for each matched doc
          for await (const recipeItem of recipe.recipes) {
            //for each element in array object (key: recipes)
            arrayObj.push({
              //push to array
              id: recipeItem._id,
              title: recipeItem.title,
              chef: `${itemChefLogin.firstname} ${itemChefLogin.lastname} `,
              postdate: recipeItem.publish,
            });
          }
        }
      }
      let temp = start_page + parseInt(current_rowinpage);
      if (temp <= arrayObj.length) {
        end_page = start_page + parseInt(current_rowinpage);
      }
      if (temp > arrayObj.length) {
        end_page = arrayObj.length;
      }
      res.render("recipelist", {
        page: "recipelist", //user session
        message: req.session.name,
        currentpage: current_page,
        startpage: start_page,
        endpage: end_page,
        viewresult: arrayObj, //array object contain data from dbase
        titlepage: "Recipes List", //title page
        rowinpage: current_rowinpage, //shown row in page
        keys: ["title", "chef", "postdate"],
        tableheader: ["#", "Title", "Chef", "Post date", "View"], //header displayed
        links: [
          { row: "5", url: "/recipelist/?rowpage=5" },
          { row: "10", url: "/recipelist/?rowpage=10" },
          { row: "15", url: "/recipelist/?rowpage=15" },
          { row: "20", url: "/recipelist/?rowpage=20" },
          { row: "25", url: "/recipelist/?rowpage=25" },
        ],
        pagenow: page_now,
      });
    } catch (err) {
      res.render("error", {
        page: "error", //user session
        message: req.session.name,
        error: err,
      });
    }
    arrayObj.length = 0;
  }

  //filter by Title
  if (filterBy == "title") {
    try {
      const recipeListFilteredByTitle = await Recipe.aggregate([
        {
          $project: {
            username: 1,
            recipes: {
              $filter: {
                input: "$recipes",
                as: "recipe",
                cond: {
                  $regexMatch: {
                    input: "$$recipe.title",
                    regex: searchValue,
                    options: "i",
                  },
                },
              },
            },
          },
        },
      ]);
      for await (const recipe of recipeListFilteredByTitle) {
        for await (const item of recipe.recipes) {
          const chefName = await Login.findOne({ username: recipe.username });
          arrayObj.push({
            id: item._id,
            title: item.title,
            chef: `${chefName.firstname} ${chefName.lastname} `,
            postdate: item.publish,
          });
        }
      }

      let temp = start_page + parseInt(current_rowinpage);
      if (temp <= arrayObj.length) {
        end_page = start_page + parseInt(current_rowinpage);
      }
      if (temp > arrayObj.length) {
        end_page = arrayObj.length;
      }
      res.render("recipelist", {
        page: "recipelist", //user session
        message: req.session.name,
        currentpage: current_page,
        startpage: start_page,
        endpage: end_page,
        viewresult: arrayObj, //array object contain data from dbase
        titlepage: "Recipes List", //title page
        rowinpage: current_rowinpage, //shown row in page
        keys: ["title", "chef", "postdate"],
        tableheader: ["#", "Title", "Chef", "Post date", "View"], //header displayed
        links: [
          { row: "5", url: "/recipelist/?rowpage=5" },
          { row: "10", url: "/recipelist/?rowpage=10" },
          { row: "15", url: "/recipelist/?rowpage=15" },
          { row: "20", url: "/recipelist/?rowpage=20" },
          { row: "25", url: "/recipelist/?rowpage=25" },
        ],
        pagenow: page_now,
      });
    } catch (err) {
      res.render("error", {
        page: "error", //user session
        message: req.session.name,
        error: err,
      });
    }
    arrayObj.length = 0;
  }
});

//----------------------------------------------------------------------------------------------------------------------------
// recipepost handler

router.get("/recipepost", async (req, res) => {
  res.render("recipepost", {
    page: "recipepost",
    message: req.session.name,
    status: "",
  });
});

//1. upload photo using multer
//2. resizing using sharp
//3. save to dbase
router.post("/recipepost", upload.single("photo"), async (req, res) => {
  var title = req.body.title;
  var publish = req.body.date;
  var description = req.body.description;

  try {
    await sharp(path.resolve("uploads", req.file.filename))
      .resize(200, 200)
      .toFile(path.resolve("uploads", `output${req.file.filename}.jpg`))
      .catch((err) => {
        console.log("Error : " + err);
      });
    await Recipe.findOneAndUpdate(
      { username: req.session.name },
      {
        $push: {
          recipes: {
            title: title,
            publish: publish,
            description: description,
            photo: {
              data: await fs.readFile(
                path.resolve("uploads", `output${req.file.filename}.jpg`)
              ),
              contentType: "image/jpg",
            },
          },
        },
      },
      { upsert: true }
    );

    res.render("recipepost", {
      page: "recipepost",
      message: req.session.name,
      status: "Save success!!",
    });
  } catch (err) {
    res.render("recipepost", {
      page: "recipepost",
      message: req.session.name,
      status: err,
    });
  }
});

//------------------------------------------------------------------------------------------------------------------------------

module.exports = router;
