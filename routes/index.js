var express = require('express');
var router = express.Router();
var IndexController = require('../controllers/index');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/temp',IndexController.temp);
router.get('/tweeters',IndexController.tweeters);
router.get('/clusters',IndexController.clusters);
router.get('/dashboard',IndexController.dashboard);



module.exports = router;
