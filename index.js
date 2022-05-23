const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vpofv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const productsCollection = client.db('tukiTaki').collection('products');
        const ordersCollection = client.db('tukiTaki').collection('orders');
        const reviewsCollection = client.db('tukiTaki').collection('reviews');
        const usersCollection = client.db('tukiTaki').collection('users');

        //Get all Product
        app.get('/products',async (req,res)=>{
            const query ={};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })

         // Get Product By ID 
         app.get('/products/:id',async(req,res)=>{
            const id = req.params.id;
            const query={_id: ObjectId(id)};
            const result = await productsCollection.findOne(query);
            res.send(result);
        })

        //Insert Ordered Data
        app.post('/orders',async(req,res)=>{
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            return res.send({success:true,result});

        })

        //Get Orders Data
        app.get('/orders',async(req,res)=>{
            const email = req.query.email;
            const query = {email:email};
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        })

        //Insert Review Data
        app.post('/reviews',async(req,res)=>{
            const reviews = req.body;
            const result = await reviewsCollection.insertOne(reviews);
            return res.send({success:true,result});

        })
        //Get all Reviews Data
        app.get('/reviews',async (req,res)=>{
            const query ={};
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

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