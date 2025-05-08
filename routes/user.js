const express = require('express');

const ConnectionRequest = require('../models/connectionRequest');
const userRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
const User = require('../models/user');


const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";


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

module.exports = userRouter;