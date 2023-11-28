const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || '5000';
require('dotenv').config();
const stripe= require('stripe')(process.env.STRIPE_SECRET_KEY);

//middlewares
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cfuzedb.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {

    //collections
    const userCollection = client.db('inventifyDb').collection('users');
    const shopCollection = client.db('inventifyDb').collection('shops');
    const productCollection = client.db('inventifyDb').collection('products');
    const cartCollection = client.db('inventifyDb').collection('carts');
    const salesCollection = client.db('inventifyDb').collection('sales');
    const reviewsCollection = client.db('inventifyDb').collection('reviews');

                                                //Users api
    //get all users for admin
    app.get('/users', async(req, res)=>{
      const result= await userCollection.find().toArray();
      res.send(result);
    })

    //insert users to DB on login 
    app.post('/users', async (req, res) => {
      const userInfo= req.body;
      const result= await userCollection.insertOne(userInfo);
      res.send(result);
    })

    app.put('/users', async(req, res)=>{
      const userInfo= req.body; 
      const filter= {email: userInfo.email}; 
      const updatedDoc= {
        $set:{
          role: 'manager', 
          shopId: userInfo.shopId, 
          shopInfo: userInfo.shopInfo
        }
      }
      const result= await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

                                                  //shop related apis
    //insert shop
    app.post('/shops', async (req, res)=>{
      const shopInfo= req.body;
      const result= await shopCollection.insertOne(shopInfo);
      res.send(result);
    })      
    
    //get shop info of user
    app.get('/shops/:email', async(req, res)=>{
      const email= req.params.email; 
      const query= {ownerEmail: email};
      const result= await shopCollection.findOne(query);      
      res.send(result);
    })

    //get all shops for admin
    app.get('/shops', async(req, res)=>{
      const result= await shopCollection.find().toArray();      
      res.send(result);
    })

    //update product limit in shop collection
    app.patch('/shops/updateLimit/:email', async(req, res)=>{
      const email= req.params.email;
      const filter= {ownerEmail: email };

      const updateDoc= {
        $set: req.body
      }
      const result= await shopCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    //update owner name and email
    // app.put('/shop/udate/owner/:shopId', async (req, res)=>{
    //   const shopId= req.params.shopId;
    //   filter={shopId: new ObjectId(shopId)};
    //   const updateDoc= {
    //     $set: {
    //       ...req.body
    //     }
    //   }

    //   const result= await shopCollection.updateOne(filter, updateDoc);
    //   res.send(result);
    // })

                                                      //Product apis
    app.post('/products', async(req, res)=>{      
      const productInfo= req.body;
      const result= await productCollection.insertOne(productInfo);
      res.send(result);
    })       
    
    // find product of a particula shop manager
    app.get('/products/:email', async(req,res)=>{
      const email= req.params.email;
      const query= {userEmail: email};
      const result= await productCollection.find(query).toArray();
      res.send(result);
    })

    //find product with id
    app.get('/product/:id', async(req, res)=>{
      const id= req.params.id;
      const query= {_id: new ObjectId(id)};
      const result= await productCollection.findOne(query);
      res.send(result);
    })

    //update a product
    app.put('/product/update/:id', async(req, res)=>{
      const id= req.params.id;
      const filter= {_id: new ObjectId(id)};
      const updatedDoc= {
        $set:{
          ...req.body
        }
      };
      const result =await productCollection.updateOne(filter, updatedDoc);
      res.send(result);
      
    })

    //delete a product
    app.delete('/product/delete/:id', async (req, res)=>{
      const id= req.params.id;
      const query= {_id: new ObjectId(id)};
      const result= await productCollection.deleteOne(query);
      res.send(result);
    })

    // -----------------------------Cart related apis

    //--insert cart
    app.post('/carts', async(req,res)=>{
      const product= req.body;
      const result= await cartCollection.insertOne(product);
      res.send(result);
    })

    
    //---------------------------find cart of a specific shop
    app.get('/carts/:email', async(req, res)=>{
      const email= req.params.email;      
      const query={userEmail: email};
      const result= await cartCollection.find(query).toArray();
      res.send(result);            
    })
    //delete cart item
    app.delete('/carts/:id', async(req,res)=>{
      const id= req.params.id;
      const query= {_id: id};
      const result= await cartCollection.deleteOne(query);
      res.send(result);
    })

    // -----------------------------Sales Collection related apis
    //-----insert into sales collection
    app.post('/sales', async(req, res)=>{
      const product= req.body;
      const result= await salesCollection.insertOne(product);
      res.send(result);
    })

    //--get sales collectio data
    app.get('/sales/:email', async(req, res)=>{
      const email= req.params.email;
      const query= {userEmail: email};
      const result= await salesCollection.find(query).toArray();
      res.send(result);
    })


    //-----------------------payment api
    //payment intent
    app.post('/create-payment-intent', async(req, res)=>{
      const {price}= req.body;
      const amount= parseInt(price * 100);

      const paymentIntent= await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })


    //---------get reviews data for testimonials    
    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })


    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', async (req, res) => {
  await res.send('Inventify server is runnig');
})

app.listen(port, () => {
  console.log(`Inventify server is running on Port: ${port}`);
})