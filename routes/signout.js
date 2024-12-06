const express = require("express");
const router = express.Router();

router.get('/signout',(req,res)=>{
    req.session.destroy((err)=>{
    //  console.log("Session destroy!!");
    })
    res.render('signout', { page: "home" });
})
router.post("/signout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.render("signout");
    
  });
});

module.exports = router;
