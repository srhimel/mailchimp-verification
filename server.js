const express = require('express')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const mailchimp = require('@mailchimp/mailchimp_marketing');

mailchimp.setConfig({
  apiKey: process.env.API_KEY,
  server: process.env.SERVER,
});


//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pt0xz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
  try {
    await client.connect();



    const db = client.db('verifyEmail');
    const collection = db.collection('emails');

    // get all emails
    app.get('/api/emails', async (req, res) => {
      const emails = await collection.find({}).toArray();
      res.send(emails);
    }
    );

    // get email by email
    app.get('/api/emails/:email', async (req, res) => {
      console.log(req.params.email);
      const email = req.params.email;
      const emailData = await collection.findOne({ email });
      res.send(emailData);
    }
    );

    // inset email
    app.post('/api/emails', async (req, res) => {
      // check if email already exists in mailchimp list
      const response = await mailchimp.lists.getListMembersInfo(process.env.LIST);
      const emailExists = response.members.find(member => member.email_address === req.body.email);

      if (emailExists) {
        const email = req.body.email;
        const emailData = await collection.findOne({ email });
        if (emailData) {
          res.status(500).send('This user already claimed the discount');
        } else {
          const storeEmail = await collection.insertOne({ email });
          console.log(storeEmail);
          res.send(storeEmail);
        }
      }
      else {
        res.status(400).send('Sorry the email is not in our subscriber list');
      }

    }
    );

  } catch (err) {
    console.log(err);
  }
  finally {
    // client.close();
  }
}


run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})