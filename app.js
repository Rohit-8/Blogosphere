//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');

const homeStartingContent = "This is a blogging website. The main purpose of blogs is to convey information in a way that is more informal or conversational than other long-form written content. Hence, on this site one can read already writen blog/s or can write their own blog/s or can do both. Blog content provides the option for readers to comment and ask questions on individual posts.";
const aboutContent = "I am an enthusiastic programmer with a highly motivated mindset. I am a Pre-final year undergraduate pursuing Computer Science and Engineering at the Institute of Engineering and Technology, Lucknow. I am a Competitive Programmer and a Web developer. I love to explore algorithms and play around with them. I actively participate in a coding contest on Codeforces and Codechef. I am willing to kickstart my career with an organization that will give me global exposure to enhance my knowledge and skills.";
const contactContent = "If you have any problem, please feel free to drop me a line. If you don't get and answer immediately. I might just be travelling through the middle of nowhere. I'll get back to you as soon as I can.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true});

const postSchema = {
  title: String,
  content: String
};

const Post = mongoose.model("Post", postSchema);

app.get("/", function(req, res){

  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
      });
  });
});

app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });


  post.save(function(err){
    if (!err){
        res.redirect("/");
    }
  });
});

app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });

});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});