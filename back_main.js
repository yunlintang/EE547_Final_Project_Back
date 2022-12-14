const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const DataLoader = require('dataloader');
const cors = require('cors');
const axios = require("axios");

const { readFileSync } = require('fs');
const {
  assertResolversPresent,
  makeExecutableSchema,
} = require('@graphql-tools/schema');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
// const { Client: PgClient } = require('pg');

const app = express();
app.use(cors());
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'content-type');
  res.header('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,OPTIONS');
  if (req.method.toLowerCase() == 'options') res.send(200);
  else next();
});

(async function () {
  let mongo_url = 'mongodb://0.0.0.0:27017/';
  try {
    _mongoConnect = await MongoClient.connect(mongo_url);
    dbase = _mongoConnect.db('EE547_final');
    console.log('connected');
  } catch (err) {
    console.error(`mongodb connection error -- ${err}`);
    process.exit(5);
  }

  const typeDefs = readFileSync('./schema-final.graphql').toString('utf-8');
  const resolvers = require('./resolvers');

  const schema = makeExecutableSchema({
    resolvers,
    resolverValidationOptions: {
      requireResolversForAllFields: 'warn',
      requireResolversToMatchSchema: 'warn',
    },
    typeDefs,
  });

  app.use(
    '/yelptest/graphql',
    graphqlHTTP(async (req) => {
      return {
        schema,
        graphiql: true,
        context: {
          db: dbase,
          loaders: {
            user: new DataLoader((keys) => getUser(dbase, keys)),
            reservation: new DataLoader((keys) => getReservation(dbase, keys)),
            restaurant: new DataLoader((keys) => getRestaurant(dbase, keys)),
          },
        },
      };
    })
  );

  app.get(
    '/search/:latitude/:longtitude/:keyword/:categories/:radius',
    (req, res) => {
      const url =
        'https://api.yelp.com/v3/businesses/search?term=' +
        req.params.keyword +
        '&latitude=' +
        req.params.latitude +
        '&longitude=' +
        req.params.longtitude +
        '&categories=' +
        req.params.categories +
        '&radius=' +
        req.params.radius;
      const options = {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization:
            'Bearer DbMZ3jE5R5kifcOcHSI3SVilxDJ05H5OYJjIh9Vqs_MnEjAT5vZDaZUCoMlTqrkBB2wqB5rpY6KfkazibQB9m_z5y0Tucyz5Mr54Ula18KTKceVpslhvfTMJ9TaHY3Yx',
        },
      };
      axios
        .get(url, options)
        .then(function (response) {
          res.status(200).send(response.data).end();
        })
        .catch(err => console.error('error:' + err));
    }
  );

  app.listen(80);
  console.log(
    // 'GraphQL API server running at http://localhost:3000/yelptest/graphql'
    'GraphQL API server running at http://54.208.32.181:80/yelptest/graphql'
  );
})();

// global scope
async function getUser(db, keys) {
  // SHOULD PARAMETERIZE THE QUERY
  //   keys.map
  //   console.log(keys[0])
  const rows = await db
    .collection('User')
    .find({ username: { $in: keys } })
    .toArray();
  //   console.log(rows)
  const results = rows.reduce((acc, row) => {
    acc[row.username] = row;
    return acc;
  }, {});
  //   console.log('results:',keys.map(key => results[key] || new Error(`user [${key}] does not exist `)))
  return keys.map((key) => results[key] || []);
  //   return keys.map(key => results[key] || new Error(`user [${key}] does not exist `));
}

async function getReservation(db, keys) {
  // SHOULD PARAMETERIZE THE QUERY
  // console.log(keys)
  let results = {};
  for (let i = 0; i < keys.length; i++) {
    let whereStr = { username: keys[i] };
    const rows = await db.collection('Reservation').find(whereStr).toArray();
    // console.log(rows)
    results[keys[i]] = rows;
  }
  // console.log('results', results)
  return keys.map(
    (key) => results[key] || new Error(`user [${key}] does not exist `)
  );
}

async function getRestaurant(db, keys) {
  // SHOULD PARAMETERIZE THE QUERY
  // console.log(keys)
  let results = {};
  for (let i = 0; i < keys.length; i++) {
    let whereStr = { name: keys[i] };
    const rows = await db.collection('Restaurant').find(whereStr).toArray();
    // console.log(rows)
    results[keys[i]] = rows;
  }
  // console.log('results', results)
  return keys.map(
    (key) => results[key] || new Error(`user [${key}] does not exist `)
  );
}

// async function getArticles(db, keys) {
//   // SHOULD PARAMETERIZE THE QUERY
//   const { rows, fields } = await db.query('SELECT * FROM article WHERE article_id IN (' + keys.join(',') + ')');
//   const results = rows.reduce((acc, row) => {
//     acc[row.article_id] = row;
//     return acc;
//   }, {});
//   return keys.map(key => results[key] || new Error(`article [${key}] does not exist `));
// }
