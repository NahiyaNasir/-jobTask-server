require("dotenv").config();
const express = require("express");

const app = express();

const cors = require("cors");
const port = process.env.PORT || 5000;
//   middle ware
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send(" Shop Hive is running  ");
});

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gze7wpc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const userCollection = client.db("shopHive").collection("users");
  const productCollection = client.db("shopHive").collection("products");
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    //   users api
    // post users
    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user)
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: " user already exits" });
      }

      const result = await userCollection.insertOne(user);
      // console.log(result);
      res.send(result);
    });
    //   get products
    app.get("/products-by-search-filter-sort", async (req, res) => {
      try {
        const search = req.query.search;
        const brandName = req.query.brandName;
        const category = req.query.category;
        const price = req.query.price;
        const sort = req.query.sort;
        const size = parseInt(req.query.size);
        const page = parseInt(req.query.page);
        console.log(size,page);
        let query = {};
        let options = {};
        if (sort === "Low to High") {
          options.sort = {Price:1}
        }
        if (sort === "High to Low") {
          options.sort = {Price:-1}
        }
       
        if(sort==='Newest Fast'){
          options.sort= {ProductCreationDate:-1}
        }
        console.log(sort);
        if (search) {
          query.ProductName = { $regex: search, $options: "i" };
        }
        // console.log(search);
        if (brandName) {
          query.BrandName = brandName;
        }
        // console.log(brandName);
        if (category) {
          query.Category = category;
          // console.log(category);
        }

        const result = await productCollection.find(query,options). skip(size * page)
        .limit(size).toArray();

        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/count", async (req, res) => {
      const search = req.query.search;
      const brandName = req.query.brandName;
      const category = req.query.category;
     
      let query = {};
      if (search) {
          query.name = { $regex: search, $options: "i" };
      }
      if (brandName) {
          query.brand = brandName;
      }
      if (category) {
          query.category = category;
      }
     
      const count = await productCollection.countDocuments(query);
      // console.log(count);
      res.send( {count} );
  });
    //  search, filter  price range
    app.get("/categorization", async (req, res) => {
      const brandNames = await productCollection
        .aggregate([
          { $group: { _id: "$BrandName" } },
          { $project: { _id: 0, brand: "$_id" } },
        ])
        .toArray();
      // console.log(brandNames);
      const categories = await productCollection
        .aggregate([
          { $group: { _id: "$Category" } },
          { $project: { _id: 0, category: "$_id" } },
        ])
        .toArray();
      // console.log(categories);
      res.send({ brandNames, categories });
    });
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`Shop Hive is running at ${port}`);
});
