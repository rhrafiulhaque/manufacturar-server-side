const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vpofv.mongodb.net/?retryWrites=true&w=majority`;


async function run(){
    try{

    }
    finally{

    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('Hello From Tukitaki')
  })
  
  app.listen(port, () => {
    console.log(`Listening ${port}`)
  })