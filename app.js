/***************************************************
* Name   : Kevin Ramirez
* Project: To Do List Web App
* File   : app.js
* Date   : 10/18/2019
****************************************************/

// jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');


// Opens connection to mongodb database
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// New schema structure for the items collection
const itemsSchema = {
  name: String
};

// Creates the items model/collection in mongoDB
const Item = mongoose.model("Item", itemsSchema);

// Creates new document called item1
const item1 = new Item({
  name: "Welcome to your todolist!"
});

// Creates new document called item2
const item2 = new Item({
  name: "Hit the + button to add a new item."
});

// Creates new document called item3
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

// Array that holds the default items in the todo list
const defaultItems = [item1, item2, item3];

// New schema structure for the lists collection
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// Creates the lists model/collection in mongoDB
const List = mongoose.model("List", listSchema);


// Home route
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      // If there are no items in the collection, Inserts the default items array into the items collection in the database
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });

      res.redirect("/");

    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});


app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        // Adds this new list to the collection
        list.save();

        res.redirect("/" + customListName);

      } else {
        // Show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});


app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    // Saves this new document into the items collection
    item.save();

    res.redirect("/");
  } else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();

      res.redirect("/" + listName);
    })
  }
});


app.post("/delete", function(req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItem, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else{

    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});



app.listen(3000, function() {
  console.log("Server is running on port 3000");
});
