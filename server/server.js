const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = 3000;
const multer = require('multer');
const loginRouter = require('./routes/login');
const signupRouter = require('./routes/signup');
const cookieParser = require('cookie-parser');

// Cloudinarty.com image hosting modules 
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "boxer",
  allowedFormats: ["jpg", "png"],
});



/* multer method is passed object with destination and filename properties with functions as values
object returned is stored as storage
*/


const upload = multer({ storage });

const itemsController = require('./controllers/itemsController');
const outfitsController = require('./controllers/outfitsController');
const historyController = require('./controllers/historyController');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());

app.use('/login', loginRouter);
app.use('/signup', signupRouter);


/* sends back today's outfit (date, ids and images) if there is one and a boolean in res.locals */
app.get('/api/outfits/today/:user', outfitsController.findTodaysOutfit, (req, res) => {
  return res.status(200).json(res.locals);
});

// sends back 5 possible outfits as an array of objects
app.get('/api/outfits/:user', itemsController.availableItems, outfitsController.setOutfits, (req, res) => {
  return res.status(200).json(res.locals.outfits);
});
////////////// CLOUDINARY UPLOAD //////////////



app.post('/api/items', upload.single('image'), itemsController.addItem, (req, res) => {
  if (req.file) {
    //res.set('Content-Type', 'application/JSON');
    //res.status(201);
    //res.send();
    console.log('res.locals.imageUrl : ', res.locals.imageUrl );
    return res.json({ imageUrl: res.locals.imageUrl });
    
  } else {
    return res.sendStatus(409).json('no files');
  }
});

app.post('/api/outfits', outfitsController.saveOutfit, itemsController.updateItemsDate, (req, res) => {
  res.status(200).send('Saved outfit and updated items date.');
});

// if whether is selcted, filter and set outfit by selected string(cold or hot for now).
app.post('/api/filterOutfits', itemsController.filterOutfits, outfitsController.setOutfits, (req, res) => {
  res.status(200).json(res.locals.outfits);
});

app.get('/api/items/:user', itemsController.getItems, (req, res) => {
  res.status(200).json(res.locals.items);
});

app.get('/api/history/:user', historyController.getHistory, (req, res) => {
  res.status(200).json(res.locals.history);
});

app.post('/api/remove', outfitsController.removeOutfit, itemsController.updateItemDates, historyController.getHistory, (req, res) => {
  res.status(200).send(res.locals.history);
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../index.html'));
});

// catch-all route handler for any requests to an unknown route
app.use('*', (req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});

// global error handler
app.use((err, req, res, next) => {
  const defaultError = {
    log: 'Express error handler caught unknown middleware error',
    status: 400,
    message: 'An error occurred',
  };
  const errObj = Object.assign(defaultError, err);
  console.error(errObj.log);
  res.status(errObj.status).json(errObj.message);
});

// launch our backend into a port
app.listen(PORT, () => console.log(`LISTENING ON PORT ${PORT}`));
