const express = require('express');

const ConnectionRequest = require('../models/connectionRequest');
const userRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
const User = require('../models/user');


const USER_SAFE_DATA = "_id firstName lastName profilePicture gender bio location age experienceLevel skills profileSummary education workExperience socialLinks";


//Get all pending connections request fo the loggedInUser
userRouter.get("/user/request/received", userAuth, async (req, res) => {

    try{
        const loggedInUser = req.user;

        const connectionRequests = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status: "interested",
        }).populate("fromUserId", USER_SAFE_DATA);

        res.json({
            message: connectionRequests.length > 0 ? "Connection requests found" : "No requests found",
            data: connectionRequests,
        });

    }catch(err){
        res.status(500).send("Something went wrong: " + err.message);

    }
});


//Get all connections of the loggedInUser, both sent and received requests(accepted)
userRouter.get("/user/connections", userAuth, async (req, res) => {

    try {
        const loggedInUser = req.user;

        const connections = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id, status: "accepted" },
                { toUserId: loggedInUser._id, status: "accepted" },
            ]
        })
        .populate("fromUserId", USER_SAFE_DATA)
        .populate("toUserId", USER_SAFE_DATA);

        const connectionsData = connections.map((connection) => {
            return connection.fromUserId._id.toString() === loggedInUser._id.toString()
                ? connection.toUserId
                : connection.fromUserId;
        });

        res.json({
            message: connectionsData.length > 0 ? "Connections found" : "No connections found",
            data: connectionsData,
        });

    }catch (err) {
        res.status(500).send("Something went wrong: " + err.message);
    }   
});


userRouter.get("/feed", userAuth, async (req, res)=>{

    //user should see all the cards except
    //1. His own card
    //2. His connections
    //3. Ignored people
    //4. Already sent the connection request

    //if entry has done in connection request , they should not see each other
    //like if one user send the req , other rejected it 

    try{
        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 30 ? 30 : limit;
        const skip = (page - 1) * limit;

        const loggedInUser= req.user;

        const connectionRequests = await ConnectionRequest.find({
            $or : [
                {fromUserId: loggedInUser._id},
                {toUserId: loggedInUser._id}
            ]
        }).select("toUserId fromUserId");

        const hideUserFromFeed = new Set();

        connectionRequests.map((connection)=>{
            hideUserFromFeed.add(connection.fromUserId.toString());
            hideUserFromFeed.add(connection.toUserId.toString());
        })

        hideUserFromFeed.add(loggedInUser._id.toString());  
        const feedUsers = await User.find({
            _id : {$nin : Array.from(hideUserFromFeed)}
        })
        .select(USER_SAFE_DATA)
        .skip(skip)
        .limit(limit);

        res.json({
            message: "Feed users fetched successfully",
            data: feedUsers
        })


    }catch(err){
        res.status(500).send("something went wrong: "+ err.message);
    }
})
module.exports = userRouter;