const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

// Connecting to the localhost of mongoose.
mongoose.connect("mongodb://localhost:27017/toDoListDB", {useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false});

app.use(express.urlencoded());
app.use(express.static("public"));

app.set('view engine', 'ejs');

// Schema for items
const itemSchema = new mongoose.Schema ({
    name: String
});

const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({name: "Welcome to your toDoList!"});
const item2 = new Item({name: "Hit the + button to add a new item!"});
const item3 = new Item({name: "<-- Hit checkbox to delete an item!"});

const listSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please check the name, no name specified!"]
    },
    items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
    Item.find({}, (err, foundItems) => {
        if(err) {
            throw err;
        } else {
            if(foundItems.length === 0) {
                Item.insertMany([item1, item2, item3], (err) => {
                    if(err) {
                        throw err;
                    }
                });
                res.redirect("/")
            } else {
                res.render('list', {listTitle: "Today", formTask: foundItems})
            }
        }
    })
});

app.get("/:customListName", function(req, res) {
    customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}, function(err, foundList) {
        if(err) {
            throw err;
        } else {
            if(!foundList) {
                const newList = new List({
                    name: customListName,
                    items: [item1, item2, item3]
                });
                newList.save();
                res.redirect("/" + customListName)
            } else {
                res.render('list', {listTitle: foundList.name, formTask: foundList.items})
            }
        }
    });
});

app.post("/", function(req, res) {
    const listName = req.body.list;
    const item = new Item({name: req.body.newItem});
    if(listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            if(err) {
                throw err;
            } else {
                foundList.items.push(item)
                foundList.save();
                res.redirect("/" + listName);
            }
        });
    }
});

app.get("/about", function(req, res) {
    res.render('about');
});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if(err) {
                throw err;
            } else {
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
            if(err) {
                throw err;
            } else {
                res.redirect("/" + listName);
            }
        })
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is started on port 3000.");
});