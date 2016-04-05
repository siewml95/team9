var express = require('express');
var router = express.Router();
var Multer = require('multer');
var IndexController = require('../controllers/index');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/test',IndexController.test);
router.get('/tweeters',IndexController.tweeters);
router.get('/clusters',IndexController.clusters);
router.get('/dashboard',IndexController.dashboard);
router.post('/search',IndexController.search);
router.post('/file',IndexController.file);

//router.post('/upload', IndexController.file);



module.exports = router;
