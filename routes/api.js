var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;

router.post('/subscribe', function (req, res, next) {
  /**
   * @type {{
   *  challenge: string,
   *  token: string,
   *  type: string
   * }}
   */
  let data = req.body;
  res.json(data?.challenge)
})