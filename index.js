let express = require("express");
let path = require("path");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();
const { DATABASE_URL } = process.env;

let app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const response = await client.query('SELECT version()');
    console.log(response.rows[0]);
  } finally {
    client.release ();
  }
}

getPostgresVersion();

//get all from novels
app.get('/novels', async (req, res) => {
    const client = await pool.connect();
    try {
        const query = "SELECT * FROM novels";
        const result = await client.query(query);
        res.json(result.rows);
    } catch(err) {
        console.log(err.stack);
        res.status(500).send("An error occured");
    } finally {
        client.release();
    }
})


//get from novels by id
app.get('/novels/:id', async(req, res) => {
  const id = req.params.id;
  const client = await pool.connect();

  try {
    const query = "SELECT * FROM novels WHERE id = $1"
    const result = await client.query(query, [id]);

    if(result.rows.length  === 0) {
      return res.status(404).send("Not Found");
    }

    res.json(result.rows);
  } catch (error) {
    console.error(error)
    res.status(500).send("An error occured");
  } finally {
    client.release();
  }
})

//update from novels by id
app.put('/novels/:id', async(req, res) => {
  const id = req.params.id;
  const updatedData = req.body
  const client = await pool.connect();

  try {
    const updateQuery = 'UPDATE novels SET title = $1, author = $2, year_published = $3 WHERE id = $4 RETURNING *'
    const queryData = [updatedData.title, updatedData.author, updatedData.year_published, id]
    const respond = await client.query(updateQuery, queryData)

    if (!updatedData.title || !updatedData.author || !updatedData.year_published) {
      res.status(400).send("Empty Field")
    }

    if (typeof updatedData.year_published !== "number") {
      res.status(400).send("Year field is Not Number")
    }
    
    res.json({ "status": "success", "message": "Novels updated successfully", "data": respond.rows})
  } catch (error) {
    console.error(error)
    res.status(500).send("An error occured");
  } finally {
    client.release();
  }
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});