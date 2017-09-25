var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
var request = require("request");
var cheerio = require("cheerio");
var path = require('path');
var port = process.env.PORT || 3000;
var exphbs = require("express-handlebars");

mongoose.Promise = Promise;

var app = express();
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.text());

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

mongoose.connect("mongodb://heroku_jtlp230x:rcjue1dl7f3i8j81fm5vf4rja4@ds127044.mlab.com:27044/heroku_jtlp230x");
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
  db.dropDatabase();
});

app.get("/scrape", function(req, res) {
  // Grab the body of the html with request
  request("https://www.nytimes.com/", function(error, response, html) {
    // Load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Grabbing every h2 of the story-heading class
    $("h2.story-heading").each(function(i, element) {
      // Save an empty result object
      var result = {};
      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      // Using our Article model, create a new entry
      var entry = new Article(result);
      Article.findOneAndUpdate(
    result, // find a document with that filter
    entry, // document to insert when nothing was found
    {upsert: true, new: true, runValidators: true}, // options
    function (err, doc) { // callback
      if (err) {
        console.log(err);
      } else {
        console.log(doc);
      }
    }
    );
    });
    res.redirect("/articles");
  });
  
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array which are not saved
  Article.find({"saved" : false}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.render("index", {article: doc});
    }
  });
});

app.get("/saved", function(req, res) {
  // Grab every saved doc in the Articles array
  Article.find({"saved" : true}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    
    else {
      res.render("savedArticles", {savedArticle : doc});
    }
  });
});
// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  Article.findOne({ "_id": req.params.id })
  .populate("note")//populate all the notes associated with it
  .exec(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  var newNote = new Note(req.body);
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
        }
      });
    }
  });
});

app.post("/remove/:id", function(req, res) {
  console.log("Inside /remove");
  Article.remove({ _id: req.params.id }, function(err) {
    if (!err) {
      res.redirect("/saved");
    }
    else {
      console.log(error);
    }
  });
});

app.post("/saveArticle/:id", function(req, res) {
  console.log("Inside /saveArticle");
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          res.redirect("/articles");
        }
      });
    });
app.get("/savedArticle", function(req, res){
  res.redirect("/saved");
});
app.get("/", function(req,res){
  res.render("index");
})
// Listen on port 3000
app.listen(port, function() {
  console.log("App running on port 3000!");
});