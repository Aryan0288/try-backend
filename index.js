const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const ws = require('ws');
const fs = require('fs');

const Message = require('./models/Message');
const User = require('./models/User');
const MONGO_URL = 'mongodb+srv://chatapp:dpJbj0tFUrqVcQU6@cluster0.ttefoc8.mongodb.net/?retryWrites=true&w=majority';





dotenv.config();

const connect = async () => {
    try { 
        await mongoose.connect(process.env.MONGO_URL);
        console.log("connect to database"); 
    } catch (err) {
        console.log("error occurr because of .env file " + err.message);
    }
} 
connect();



const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);


const app = express();
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: "https://aryan-chat-hub.netlify.app",
    credentials: true,
}))



app.get('/test', (req, res) => {
    res.json('test ok');
});
console.log("Hello ji I am a Index.js file in api folder");

// async function getUserDataFromRequest(req) {
//     return new Promise((resolve, reject) => {
//         // console.log("User send Message");
//         const token = req.cookies?.token;
//         if (token) {
//             jwt.verify(token, jwtSecret, {}, (err, userData) => {
//                 if (err) throw err;
//                 resolve(userData);
//             });
//         }
//         else {
//             return res.status(501).json({status:false,message:reject});
//         }

//     })
// }

async function getUserDataFromRequest(req) {
    try {
        const token = req.cookies?.token;
        if (token) {
            const userData = jwt.verify(token, jwtSecret, {});
            return userData;
        } else {
            return new Error('Token not found');
        }
    } catch (error) {
        return { status: false, message: error.message }; // Assuming you're handling the response in the caller
    }
}


app.get("/", async (req, res) => {
    console.log("i am in /");
    const data = await User.find({});
    res.json({ success: true, data: data });
    // res.json("hello");
})

app.get('/messages/:userId/:ourUserId', async (req, res) => {
    const { userId } = req.params;
    const { ourUserId } = req.params;
    // console.log("userId : ",userId);
    // console.log("ourUserId : ",ourUserId);

    const messages = await Message.find({
        sender: { $in: [userId, ourUserId] }, 
        recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 })

    res.json(messages);
})

app.delete('/messages/:id', async (req, res) => {
    const messageId = req.params.id;
    console.log("id : " + messageId);

    // const data=await Message.findByIdAndDelete({_id:messageId});
    // res.send({success:true,message:"data delete succesfully",data:data});


    try {
        // Find the message by ID and remove it
        //   const deletedMessage = await Message.findByIdAndRemove(messageId);
        const deletedMessage = await Message.findOneAndDelete({ _id: messageId });

        if (!deletedMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Successful deletion
        //   res.json({ message: 'Message deleted successfully' });
        console.log("message deleted");
        res.status(200).json({ message: 'Message deleted successfully', deletedMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/people', async (req, res) => {
    const users = await User.find({}, { '_id': 1, username: 1 });
    res.json(users);
})

// create profile 
app.get('/profile', (req, res) => {
    // const token = req.cookies?.token;
    const token=localStorage.getItem("token");
    console.log(token);
    console.log("token: ", token);

    if (token) { 
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            // console.log("user data in profile : ",userData);
            return res.json(userData);
        });
    } else {
        return res.status(401).json('no token');
    }
})

app.put('/verify', async (req, res) => {
    try {
        const email = req.body.emailLs;
        console.log("email in verify ",email);
        await User.findOneAndUpdate({ email: email }, { $set: { status: true } });
        return res.status(201).json({ success: true });
    } catch (err) {
        console.log("Error occurred in /verify POST:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.delete("/notverifyDeleted", async (req, res) => {
    try {
        console.log("delete succesfully non verified account");
        await User.deleteMany({ status: false });
        return res.status(201).json({ success: true, message: "deleted" });
    } catch (err) {
        console.log("error occur non verified account");
        return;
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log("I am in the login ",username,password);

    try {
        let foundUser;
        foundUser = await User.findOne({ email: username });
        // console.log(foundUser);
        if (foundUser === null) {
            console.log("User not found")
            return res.status(404).json({ message: "User NotFound!" });
        }
        if (!foundUser.status) {
            console.log("user not verify");
            return res.status(404).json({ success: false, message: "User NotFound!" });
        }

        if (foundUser) {

            const passOk = bcrypt.compareSync(password, foundUser.password);
            if (passOk) {

                const payload = {
                    email: foundUser.email,
                    id: foundUser._id, 
                    username: foundUser.username,
                }
                // return res.status(201).json({success:true,data:payload});
                const token = jwt.sign(payload, jwtSecret, { expiresIn: '1D' });
                const options = {
                    expiresIn: "1D",
                    httpOnly: true,
                    secure: true,
                    sameSite:"none",
                    Path:"/"
                }
                res.cookie('token', token, options).status(201).json({
                    success: true,
                    token: token,
                    foundUser,
                    message: `${foundUser.username} Login Successful`,
                })
                
            } else {
                return res.status(401).json({ message: 'Invalid password' });
            }

        } else {
            return res.status(404).json({ message: 'User NotFound!' });
        }

    }
    catch (err) {
        console.error("error during login : ", err.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})

app.post('/logout', (req, res) => {
    localStorage.removeItem("token"); 
    return res.cookie('token', '', { sameSite: 'none', secure: true }).json('ok');
})

const sendMail = require('./connection/sendMail.js');

app.post('/register', async (req, res) => {
    console.log("I am inside register");
    const { username, password, email } = req.body;
    try {
        // Check if the email already exists
        const chkEmailVerify = await User.findOne({ email });
        if (chkEmailVerify && chkEmailVerify.status) {
            // Email already registered
            return res.status(400).json({ message: 'Email already registered' });
        }

        if(chkEmailVerify && !chkEmailVerify.status){
            await User.findOneAndDelete({email});
        }
        // const existingUser = await User.findOne({ email });


        console.log(username + " " + email + " " + password);
        const hashPassword = bcrypt.hashSync(password, bcryptSalt);
        const createdUser = await User.create({
            username: username,
            password: hashPassword,
            email: email,
        });
        const otp = Math.floor(1000 + Math.random() * 900000);
        await sendMail(email, "Hello " + username + " Account verification Email", otp);
        console.log("otp: ", otp);
        res.status(201).json({ success: true, message: "User created successfully", otp: otp });

    } catch (err) {
        if (err) throw err;
        res.status(500).json('ok');
    }

})

const PORT = process.env.PORT || 4040
console.log("Port: ", PORT)
const server = app.listen(PORT);



// const wss = new ws.WebSocketServer({ server });
// wss.on('connection', (connection, req) => {

//     function notifyAboutOnlinePeople() {
//         [...wss.clients].forEach(client => {
//             client.send(JSON.stringify({
//                 online: [...wss.clients]
//                     .map(c => ({ userId: c.userId, username: c.username })),
//             }));
//         }
//         )
//     }


//     connection.isAlive = true;

//     connection.timer = setInterval(() => {
//         connection.ping();
//         connection.deathTimer = setTimeout(() => {
//             connection.isAlive = false;
//             clearInterval(connection.timer);
//             connection.terminate();
//             notifyAboutOnlinePeople();
//             // console.log('continue-1');
//             // console.log('continue-2');
//         }, 1000);
//     }, 5000);

//     connection.on('pong', () => {
//         clearTimeout(connection.deathTimer); 
//     })

//     console.log("I am ping pong");

//     const cookies = req.headers.cookie;
//     console.log("storage: ",cookies);


//     if (cookies) {
//         const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));

//         if (tokenCookieString) {
//             const token = tokenCookieString.split('=')[1];
//             if (token) {
//                 jwt.verify(token, jwtSecret, {}, async (err, UserData) => {
//                     if (err) throw err;
//                     // console.log("cookies is here: ",token);
//                     const { id, username } = UserData;
//                     // console.log("User data userId : ",id);
//                     // console.log("User data username : ",username);

//                     try {
//                         const user = await User.findById(id);
//                         if (user) {
//                             connection.userId = id;
//                             connection.username = user.username; // Use the actual username from the database
//                             // console.log("The username is " + user.username);
//                         }
//                     } catch (error) { 
//                         console.error(error);
//                     }

//                 })
//             }
//         }
//     }

    

//     // Handle All Messages through this funtion
//     connection.on('message', async (message) => {
//         const messageData = JSON.parse(message.toString());
//         const { sender,recipient, text, file } = messageData;
//         // senderId=sender;
        
//         let filename = null;
//         if (file) {
//             const parts = file.name.split('.');
//             const ext = parts[parts.length - 1];
//             filename = Date.now() + '.' + ext;
//             const path = __dirname + "/uploads/" + file.name;
//             const bufferData = new Buffer(file.data.split(',')[1], 'base64');
//             let d = new Date();

//             fs.writeFile(path, bufferData, () => {
//             })
//         }

//         if (recipient && (text || file)) {
//             const MessageDoc = await Message.create({
//                 sender: connection.userId,
//                 recipient,
//                 text,
//                 file: file ? file.name : null,
//             });

//             // console.log("reciept ",recipient);
//             // console.log("userId ",connection.userId);
//             // [...wss.clients]
//             //     .filter(c => c.userId === recipient)
//             //     .forEach(e => console.log("forEach: ", e.userId, e.username));

//             console.log("reciept: ", recipient);

//             [...wss.clients]
//                 .filter(c => c.userId === recipient)
//                 .forEach(c => c.send(JSON.stringify({
//                     text,
//                     sender: connection.userId,
//                     recipient,
//                     file: file ? file.name : null,
//                     _id: MessageDoc._id,
//                 })));
//             console.log("file created succesfully");
//         }
//     });

    


//     // notify everyone about online people (when someone connects)
//     notifyAboutOnlinePeople();
// });

const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {
    function notifyAboutOnlinePeople() {
        const onlineUsers = [...wss.clients].map(c => ({ userId: c.userId, username: c.username }));
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({ online: onlineUsers }));
        });
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
            console.log('continue-1');
            console.log('continue-2');
        }, 1000);
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });

    const cookies = req.headers.cookie;
    console.log(cookies);
    if (cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
        console.log("tokenString: ",tokenCookieString);
        
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1];
            console.log("token: ",token);
            if (token) {
                jwt.verify(token, jwtSecret, {}, async (err, UserData) => {
                    if (err) throw err;

                    const { id, username } = UserData;
                    console.log("userData: ",UserData);
                    console.log("userId: ",id);
                    try {
                        const user = await User.findById(id);
                        console.log("user: ",user);
                        if (user) {
                            connection.userId = id;
                            connection.username = user.username;
                        }
                    } catch (error) {
                        console.error(error);
                    }

                })
            }
        }
    }

    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString());
        const { recipient, text, file } = messageData;
        let filename = null;
        if (file) {
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1];
            filename = Date.now() + '.' + ext;
            const path = __dirname + "/uploads/" + filename;
            const bufferData = Buffer.from(file.data.split(',')[1], 'base64');

            fs.writeFile(path, bufferData, () => {
                console.log("file saved : " + path);
            });
        }
        console.log("filename : ", filename);
        console.log("text : ", text);

        if (recipient && (text || file)) {
            const MessageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
                file: file ? filename : null,
            });

            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({
                    text,
                    sender: connection.userId,
                    recipient,
                    file: file ? filename : null,
                    _id: MessageDoc._id,
                })));
            console.log("file created successfully");
        }
    });

    notifyAboutOnlinePeople();
});








