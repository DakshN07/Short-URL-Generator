const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser")
const {connectToMongoDB} = require("./connect");
const { checkForAuthentication, restrictTo } = require("./middlewares/auth")
const staticRouter = require("./routes/staticRouter");
const app = express();
const PORT = 8001;

const urlRoute = require("./routes/url");
const URL = require("./models/url");
const userRoute =require("./routes/user")

connectToMongoDB("mongodb://localhost:27017/short-url")
.then(() => console.log("MongoDB Connected"))

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended:false}));
app.use(cookieParser());
app.use(checkForAuthentication);

app.use("/url", restrictTo(["NORMAL", "ADMIN"]), urlRoute);
app.use("/user", userRoute);
app.use("/", staticRouter);

app.get('/url/:shortId', async(req, res) => {
    const shortId = req.params.shortId;
    try {
        const entry = await URL.findOneAndUpdate(
            {
                shortId
            },
        {$push:{
                visitHistory: {
                    timestamp: Date.now(),
                },
            },
        },
            { new:true }
        );
        if(!entry){
            return res.status(404).send('URL not found');
            } 
            res.redirect(entry.redirectURL);
        }catch (error) {
                console.error('Error fetching URL entry:', error);
                res.status(500).send('Internal Server Error');
            }
        });

app.listen(PORT,() => console.log(`Server started at PORT: ${PORT}`));