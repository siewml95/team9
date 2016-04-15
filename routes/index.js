var express = require('express');
var router = express.Router();
var Multer = require('multer');
var IndexController = require('../controllers/index');



router.get('/',IndexController.dashboard);
router.get('/test',IndexController.test);
router.post('/test',IndexController.QTest);


router.post('/file',IndexController.file);

//router.post('/upload', IndexController.file);



module.exports = router;
