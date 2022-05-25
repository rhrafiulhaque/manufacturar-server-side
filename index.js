const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { verify } = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vpofv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// Verify JWT 

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}



async function run() {
    try {
        await client.connect();
        const productsCollection = client.db('tukiTaki').collection('products');
        const ordersCollection = client.db('tukiTaki').collection('orders');
        const reviewsCollection = client.db('tukiTaki').collection('reviews');
        const usersCollection = client.db('tukiTaki').collection('users');
        const paymentCollection = client.db('tukiTaki').collection('payments');


        //User Collection
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ result, token });

        })


        //Payment Section Stripe
        app.post('/create-payment-intent', async (req, res) => {
            const service = req.body;
            const price = service.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret });
        })


        //Get User Data By email
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        //Get All User
        app.get('/user', verifyJWT, async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
        })

        //User To Make Admin
        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        //Check Admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user?.role === 'admin';
            res.send({ admin: isAdmin });
        })


        //   Insert Product 
        app.post('/product', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })



        //Get all Product
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })

        //Delete Product By ID
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = productsCollection.deleteOne(filter);
            res.send(result);
        })


        // Get Product By ID 
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.findOne(query);
            res.send(result);
        })

        //Insert Ordered Data
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            return res.send({ success: true, result });

        })

        //Get Orders Data
        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const authorization = req.headers.authorization;
            const query = { email: email };
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        })

        // Get Order by id 
        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const order = await ordersCollection.findOne(query);
            res.send(order);
        })


        // Order Update by id 
        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId,
                }
            };
            const updatedOrder = await ordersCollection.updateOne(filter, updateDoc);
            const result = await paymentCollection.insertOne(payment);
            res.send(updateDoc);
        })

        // Order Shiped by id 
        app.patch('/ordership/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    shipped: true,
                }
            };
            const updatedOrder = await ordersCollection.updateOne(filter, updateDoc);
            res.send(updateDoc);
        })


        //Get All Orders Data
        app.get('/allorders', async (req, res) => {
            const query = {};
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })

        //Delete Order By ID
        app.delete('/allorder/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = ordersCollection.deleteOne(filter);
            res.send(result);
        })

        //Insert Review Data
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            const result = await reviewsCollection.insertOne(reviews);
            return res.send({ success: true, result });

        })
        //Get all Reviews Data
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello From Tukitaki')
})

app.listen(port, () => {
    console.log(`Listening ${port}`)
})