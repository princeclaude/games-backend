import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, },
    
    createdTime: { type: Date, default: Date.now },
    profileImage: {type: String, default: ""},
    star: { type: String, default: "Debutant" },
    online: { type: Boolean, default: false },
    isplaying: { type: Boolean, default: false },
    PushSubscription: {
        endpoint: String,
        keys: {
            p256dh: String,
            auth: String,
        },
    }, 
    
    lastLogin: { type: Date },
    lastActive: { type: Date, default: Date.now },
   
    
});

export default mongoose.model("User", userSchema)