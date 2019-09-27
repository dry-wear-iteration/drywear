const { pool } = require('../config');
const bcrypt = require('bcryptjs');
const SALT_WORK_FACTOR = 10;

const userController = {};

userController.verifyUser = (req, res, next) => {
    const username = req.body.username; 

    pool.query('SELECT * FROM "user" WHERE username = $1', [username], (err, result) => {
        if (err || !result) {
            // res.redirect('/login');
            return next({
                log: `userController.verifyUser: ERROR: ${err}`,
                message: { err: 'userController.createUser: ERROR: Check server logs for details' }
            });
        }
        
        bcrypt.compare(req.body.password, result.rows[0].password, (err, isMatch) => {
            if (err || !isMatch) {
                // res.redirect('/login');
                return next({
                    log: `userController.verifyUser: ERROR: ${err}`,
                    message: { err: 'userController.verifyUser: ERROR: Check server logs for details' }
                }); 
            }
    
            if (isMatch) {
                res.locals.sessionId = result.rows[0]._id;
                // res.redirect('/');
                return next();
            }
        });
    });
}

userController.createUser = (req, res, next) => {
    const { username, password } = req.body;

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if(err) return next({
            log: `userController.createUser: ERROR: ${err}`,
            message: { err: 'userController.createUser: ERROR: Check server logs for details'}
        });

        bcrypt.hash(password, salt, function(err, bcryptPassword) {
            if(err) return next({
                log: `userController.createUser: ERROR: ${err}`,
                message: { err: 'userController.createUser: ERROR: Check server logs for details'}
            });

            const queryArr = [username, bcryptPassword];
            pool.query('INSERT INTO "user" (username, password) VALUES ($1, $2) RETURNING _id', queryArr)
                .then((result) => {
                    res.locals.sessionId = result.rows[0]._id;
                    return next();
                })
                .catch((err) => next({
                    log: `userController.createUser: ERROR: ${err}`,
                    message: { err: 'userController.createUser: ERROR: Check server logs for details'}
                }))
        })
    })

}

userController.startSession = (req, res, next) => {
    const today = new Date();
    pool.query(`INSERT INTO "sessions" ("cookie_id", "created_at") VALUES ($1, $2)`, [res.locals.sessionId, today], (err, result) => {
        if (err) {
            return next({
                log: `userController.startSession: ERROR: ${err}`,
                message: { err: 'userController.startSession: ERROR: Check server logs for details' }
            });
        }
        console.log('startSession controller');
        return next();
    });
}

userController.setSSIDCookie = (req, res, next) => {
    res.cookie('ssid', res.locals.sessionId, {expires: new Date(Date.now() + 900000), httpOnly: true});
    return next();
}

userController.isLoggedIn = (req, res, next) => {
    pool.query('SELECT * FROM "sessions" WHERE "cookie_id" = $1', [req.cookies.ssid], (err, result) => {
        if (err || !result.rows[0]) {
            res.locals.isLoggedIn = false;
            return next();
        } else {
            res.locals.isLoggedIn = true;
            pool.query('SELECT "username" FROM "user" WHERE "_id" = $1', [req.cookies.ssid], (err, result) => {
                if (err) {
                    return next({
                        log: `userController.isLoggedIn: ERROR: ${err}`,
                        message: { err: 'userController.isLoggedIn: ERROR: Check server logs for details' }
                    });
                }
                res.locals.currentUser = result.rows[0].username;
                return next();
            });
        }
        
    });
}

module.exports = userController;