const express = require('express');
const router = express.Router();

router.get('/about',(req,res)=>{
    res.render('about',{page:'about',message:req.session.name});
})
module.exports = router;