var express = require('express');
var router = express.Router();
var Multer = require('multer');
var IndexController = require('../controllers/index');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/dashboard',IndexController.dashboard);
router.post('/file',IndexController.file);

//router.post('/upload', IndexController.file);



module.exports = router;
