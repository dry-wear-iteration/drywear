const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/", userController.createUser, userController.startSession, userController.setSSIDCookie, (req, res) => {
    return res.json('Success: user created');
});

module.exports = router;