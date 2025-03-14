import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';
import bcryptjs from "bcryptjs";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from 'passport-google-oauth2';
import session from "express-session";
import env from 'dotenv';



const app = express();
const port = 3000;
const saltRounds = 10
env.config()

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}));

const db = new pg.Client({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});

db.connect();


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));



app.use(passport.initialize());
app.use(passport.session());


function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized" });
}

let items = []
let Notes = []


app.get('/', (req,res) => {
    res.render('login.ejs')
});

app.get('/register', (req, res) => {
    res.render('register.ejs')
})


app.get('/home', async (req, res) => {
    if (req.isAuthenticated()) {
        const currentUser = req.user
        try {
            //const results = await db.query('select * from books where user_email = $1', [req.user.email])
            const results = await db.query("SELECT id, user_email, title, author, TO_CHAR(start_date, 'Dy Mon DD YYYY') AS start_date, TO_CHAR(end_date, 'Dy Mon DD YYYY') AS end_date, rating, summary, book_values FROM books where user_email = $1 ", [req.user.email]);
            items = results.rows
            //console.log(items)
            res.render('index.ejs', {
                listItems: items,
                currentUser,
            })
        } catch (error) {
            console.log(error)
        }
    } else {
        res.redirect('/')
    }
    
    
});

app.get('/notes', async (req, res) => {
    const book_id = req.query.id
    if (req.isAuthenticated()) {
        const currentUser = req.user
        //console.log(currentUser)
        //console.log(book_id)
        try {
            const result = await db.query('select * from books join notes on books.id = book_id where book_id = $1', [book_id])
            Notes = result.rows

            if (Notes.length === 0) {
                const result = await db.query('select * from books where id =$1', [book_id])
                let book =result.rows
                //console.log(book)
                res.render('index2.ejs',{
                    listItems: book
                })
    
            } else {
                res.render('index2.ejs', {
                listItems: Notes
                })
            }
            
        } catch (error) {
            console.log(error)
        }
    } else (
        res.redirect('/')
    )
    
}) 
app.get('/new', async (req, res) => {
    if (req.isAuthenticated()) {
            res.render('new.ejs')

    } else {
        res.redirect('/')
    }
});

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
 )

 app.get(
    "/auth/google/secrets",
    passport.authenticate("google", {
      successRedirect: "/home",
      failureRedirect: "/",
    })
  );

app.post('/login', 
    passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/register'
    })
)
//to collect data new book data from user. 
app.post('/new-book', async (req, res) => {
    if (req.isAuthenticated()) {
        const Title = req.body.title
        const Author = req.body.author
        const startDate = req.body.startDate
        const endDate = req.body.endDate
        const Rating = req.body.rating
        const Summary = req.body.summary
        const bookValues = req.body.book_values
        const currentUser = req.user.email

        //console.log(Title,Author,Date,Rating,Summary,Isbn)

        try {
            await db.query('insert into books (user_email,title,author,start_date,end_date,rating,summary,book_values) values ($1,$2,$3,$4,$5,$6,$7,$8)',
                [currentUser,Title,Author,startDate,endDate,Rating,Summary,bookValues])
        } catch (error) {
            console.log(error)
        }
        res.redirect('/home')
    } else {
        
    }
    
});
//THIS IS WHERE I STOPPED AND ALSO THE CURRENT BATTLEGROUND.
//BATTLEFIELD WON!!!!
app.post('/submit', async (req, res) => {
    if (req.isAuthenticated()) {
        const currentUser = req.user;
        console.log(currentUser)
        const noteId = req.body.notes_id
        const notes = req.body.notes
        //console.log(noteId)
        //console.log(notes)

        try {
            await db.query('insert into notes (user_email,note, book_id) values ($1,$2,$3) ', [currentUser.email,notes,noteId]);
            res.redirect('/home')

        } catch (error) {
            console.log(error)
        }
    } else {
        
    }
        
    

})

app.post('/register', async (req, res) => {
    const Email = req.body.email;
    const Password = req.body.password;
    const Username = req.body.username;

    try {
        const checkDb = await db.query('select * from users where email = $1', [Email])

        if (checkDb.rows.length > 0) {
            res.redirect('/')
        } else {
            bcryptjs.hash(Password, saltRounds, async (err, hash) => {
                if (err) {
                    console.error("Error hashing password:", err);
                } else {
                    const result = await db.query(
                        'INSERT INTO users (email, username, passwords) VALUES ($1, $2, $3) RETURNING email, passwords',
                        [Email, Username, hash]
                    );
                    const user = result.rows[0];
                    req.login(user, (err) => {
                        console.log(err);
                        res.redirect('/home')
                    })
                }
            })
        }
    } catch (error) {
        console.log(error)
    }
});

passport.use('local', 
    new Strategy({usernameField: 'email'},async function verify(email, password, cb) {
        try {
            const result = await db.query('select * from users where email = $1', [email]);
            
            if (result.rows.length > 0) {
                const user = result.rows[0];
                const storedPassword = user.passwords
                bcryptjs.compare(password, storedPassword, (err, valid) => {
                    if (err) {
                        console.error("Error comparing passwords:", err);
                        return cb(err);
                    } else {
                        if (valid) {
                            return cb(null, user);
                        } else {
                            return cb(null, false);
                        }
                    }
                })
            } else {
                console.log(result.rows[0])
                return cb("User not found");
            }
            
        } catch (error) {
            console.log(error)
        }
    })
);

passport.use('google',
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    async (accessToken, refreshToken, profile, cb) => {
        
        try {
            //console.log(profile);
            const result = await db.query('select * from users where email = $1', [profile.email]);

            if (result.rows.length === 0) {
                const newUser = await db.query('insert  into users (email, username, passwords) values ($1,$2, $3) RETURNING email, passwords', [profile.email, profile.given_name, profile.id]);
                //console.log(newUser.rows[0]);
                return cb(null, newUser.rows[0]);
            } else {
                return cb(null, result.rows[0]);
            }
        } catch (err) {
            return cb(err);
        }
    }
)
)


passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });
app.listen(port, () => {
    console.log(`server running at port ${port}`)
});