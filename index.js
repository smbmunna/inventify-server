const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || '5000';
require('dotenv').config();

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

                                                //Users api
    
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