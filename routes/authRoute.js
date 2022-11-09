const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const is_auth = require("../middleware/authentication");


router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "Provide both email and password" });

    await User.findOne({ email }).then((user) => {
        if (!user) {
            return res.status(400).json({
                msg: "Invalid Credentials!",
            });
        }

        bcrypt.compare(password, user.password).then((isMatch) => {
            if (!isMatch) {
                return res.status(400).json({ error: "Invalid Credentials" });
            }

            const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });

            const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });

            // Assigning refresh token in http-only cookie 
            res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
            return res.json({
                token: accessToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    blogs: user.blogs,
                },
            });

            // jwt.sign({ id: user._id }, process.env.JWT_SECRET, (err, token) => {
            //     if (err) throw err;

            //     res.json({
            //         token: token,
            //         user: {
            //             id: user._id,
            //             username: user.username,
            //             email: user.email,
            //             avatar: user.avatar,
            //             blogs: user.blogs,
            //             isAdmin: user.isAdmin
            //         },
            //     });
            // });
        });
    });
});

router.post('/refresh', (req, res) => {
    if (req.cookies?.jwt) {
        const refreshToken = req.cookies.jwt;
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err) {
                    return res.status(406).json({ message: 'Unauthorized' });
                }
                else {
                    const accessToken = jwt.sign({
                        id: decoded.id,
                    }, process.env.ACCESS_TOKEN_SECRET, {
                        expiresIn: '10m'
                    });
                    return res.json({ accessToken });
                }
            })
    } else {
        return res.status(406).json({ message: 'Unauthorized' });
    }
})


router.get("/", is_auth, async (req, res) => {
    const { username, socialMedia, _id, email, blogs } = await User.findById(req.user.id).populate("blogs");

    res.json({
        username,
        socialMedia,
        _id,
        email,
        blogs,
    });
});


router.post("/register", async (req, res) => {
    try {
        const { username, name, email, password} = req.body;
        console.log(req.body)
        if (!username || !email || !password)
            return res.status(400).json({ error: "Provide all the fields" });
        const result = await User.findOne({ $or: [{ email: email }, { username: username }], });
        console.log(result)
        if (result) {
            res.status(400).json({ "message": "User already exists" });
        } else {
            const newUser = new User({
                username,
                name,
                email,
                password
            });
            console.log(newUser)
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (error, hash) => {
                    if (error) throw error;

                    newUser.password = hash;

                    newUser.save()
                        .then((user) => {
                            res.json({ msg: "User registered." }).status(200);
                        });
                });
            });
        }
    } catch (error) {
        res.status(501).json({ "error": "Error" })
    }
});




module.exports = router;
