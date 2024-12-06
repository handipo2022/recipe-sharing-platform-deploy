const express = require('express');
const router = express.Router();

router.get('/navbar',(req,res)=>{
    res.render('navbar');
})

module.exports = router;