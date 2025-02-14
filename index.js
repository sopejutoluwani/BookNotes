import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';
import axios from "axios";


const app = express();
const port = 3000;

const db = new pg.Client({
    host: 'localhost',
    user: 'postgres',
    password: '123456',
    database: 'book notes',
    port: 5432
});

db.connect();


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

let items = []
let Notes = []

app.get('/', async (req, res) => {
    try {
        const results = await db.query('select * from books order by id asc')
        items = results.rows
        res.render('index.ejs', {
            listItems: items,
        })
    } catch (error) {
        console.log(error)
    }
    
});

app.get('/notes', async (req, res) => {
    const id = req.query
    //console.log(id)

    try {
        const results = await db.query('select * from books join notes on books.id = books_id where books_id = $1', [id.id]);
        Notes = results.rows
        //console.log(Notes);
        if (Notes.length === 0) {
            const result = await db.query('select * from books where id =$1', [id.id])
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
}) 
app.get('/new', async (req, res) => {
    res.render('new.ejs')
});
//to collect data new book data from user. 
app.post('/new-book', async (req, res) => {
    const Title = req.body.title
    const Author = req.body.author
    const Date = req.body.date
    const Rating = req.body.rating
    const Summary = req.body.summary
    const Isbn = req.body.isbn

    console.log(Title,Author,Date,Rating,Summary,Isbn)

    try {
        await db.query('insert into books (title,author,dates,rating,summary,b_values) values ($1,$2,$3,$4,$5,$6)',
            [Title,Author,Date,Rating,Summary,Isbn])
    } catch (error) {
        console.log(error)
    }
    res.redirect('/')
});

app.post('/submit', async (req, res) => {
    const noteId = req.body.notes_id
    const notes = req.body.notes
    console.log(noteId)
    //console.log(notes)

    try {
        await db.query('insert into notes (notes, books_id) values ($1,$2) ', [notes,noteId]);
        res.redirect('/')

    } catch (error) {
        console.log(error)
    }

})


app.listen(port, () => {
    console.log(`server running at port ${port}`)
});