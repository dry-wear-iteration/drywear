const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.get("/", userController.isLoggedIn, (req, res) => {
    if (res.locals.isLoggedIn) {
    return res.status(200).json({currentUser: res.locals.currentUser, isLoggedIn: res.locals.isLoggedIn});
    }
    return res.status(200).json({isLoggedIn: res.locals.isLoggedIn});
});

router.post("/", userController.verifyUser, userController.startSession, userController.setSSIDCookie, (req, res) => {
    return res.status(200).json("verified");
});

module.exports = router;