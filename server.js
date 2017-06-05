/* server side programming for the node.js   */

const bodyParser = require('body-parser');
const express = require('express');
const fetch = require('node-fetch');
const ebay = require('./privateSettings.json');
const cron = require('node-cron');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const jsonParser = bodyParser.json();

app.use(express.static('public'));

/* global variables                               */
let db = null;
let collection = null;
let pastItems = null;
let transporter = null;

/* initialize the database and email transport    */
async function main() {

    const DATABASE_NAME = 'cs193x-db';
    const COLLECTION = 'queries';
    const PAST_ITEMS = 'items';
    const MONGO_URL = `mongodb://localhost:27017/${DATABASE_NAME}`;
    const relayEmail = "msande107@gmail.com";
    const relayPass = "flawofaverages";

    // The "process.env.MONGODB_URI" is needed to work with Heroku.
    db = await MongoClient.connect(process.env.MONGODB_URI || MONGO_URL);

    // two collections are in use: queries and previously found items
    collection = db.collection(COLLECTION);
    pastItems = db.collection(PAST_ITEMS);

    // The "process.env.PORT" is needed to work with Heroku.
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Server listening on port ${port}!`);

    // initialize email transport
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: relayEmail,
            pass: relayPass
        }
    });
};

main();

/////////////////////////////////////////////////////////////////////

/* Main working function periodically called by crontab */
/* Walks over existing queries and calls ebay for matches */
/* New matches are recorded in DB and mailed to the user */

async function checkMarketPlace() {

    console.log('checking..');

    const queries = await getQueries();

    for (let i = 0; i < queries.length; i++) {

        let textBody = '';
        let htmlBody = '';
        let numNew = 0;
        let searchBody = queries[i];
        let response = await ebaySearch(searchBody);

        if (response != null) { // search can be inactive

            let list = response["findItemsAdvancedResponse"][0]['searchResult'][0];

            let itemNumber = list['@count'];
            console.log("Items reported in query " + i + ": " + itemNumber);

            if (itemNumber != "0") {
                let items = list['item']; // array of search results

                for (let j = 0; j < items.length; j++) {

                    let itemID = items[j]['itemId'][0];
                    let itemUrl = items[j]['viewItemURL'][0];
                    let found = await findID(itemID);

                    if (!found) { // new item, need to act on it!

                        console.log("New Item ID:" + itemID);

                        numNew++;
                        htmlBody += `<a href=${itemUrl}>${itemUrl}<\/a><br>`;
                        textBody += `${itemUrl}\n`;
                    }
                }
                // all items can be old news...
                if (textBody != '') { // there is something to mail
                    console.log(numNew + " new items found");
                    sendMail(searchBody, textBody, htmlBody, numNew);
                } else {
                    console.log("No new items found");
                }
            }
        } else {

            console.log(`Skipping inactive query ${searchBody['name']}`);
        }
    }
}

/* sendmail helper function  */
function sendMail(searchBody, textBody, htmlBody, numNew) {

    //console.log('Text:' + textBody);
    //console.log('HTML:' + htmlBody);

    let item = 'item';
    if (numNew > 1) item += 's';

    let mailOptions = {
        from: `DK 👻 <no-reply@gmail.com>`, // sender address
        to: searchBody['email'], // list of receivers
        subject: `eBay ${searchBody['name']}: ${numNew} new ${item} found ✔`, // Subject line
        text: textBody, // plain text body
        html: htmlBody // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
}

/* */
async function findID(itemID) {

    const searchString = {
        itemId: itemID
    };

    let response = await pastItems.findOne(searchString);
    if (response === null) {

        let status = await pastItems.insertOne(searchString);
        return false;

    } else return true;
}


/* messageBody is an object with fields                            */
/* 'name', 'keywords', 'mPrice', 'xPrice', 'categoryID', 'deployed'*/
/* this search does not use 'name' or 'deployed'                   */

async function ebaySearch(messageBody) {

    if (messageBody['deployed'] === 'true') {

        let keywords = encodeURI(messageBody['keywords']);

        let categoryId = '';
        let soldItemsOnly = '';
        let opName = '';

        // category is optional anyway
        if (messageBody['categoryID'] != null)
            categoryId = '&categoryId=' + messageBody['categoryID'];

        // completed listings are only returned on trial run
        if (messageBody['deployed'] === 'completed') {

            soldItemsOnly = '&itemFilter(4).name=SoldItemsOnly&itemFilter(4).value=true';
            opName = ebay.opNameS;

        } else {
            opName = ebay.opName;
        }

        let mPrice = messageBody['mPrice'];
        let xPrice = messageBody['xPrice'];
        let minPrice = `itemFilter(2).name=MinPrice&itemFilter(2).value=${mPrice}`;
        let maxPrice = `itemFilter(3).name=MaxPrice&itemFilter(3).value=${xPrice}`;

        // listing types are harcoded for fixed price & conditions
        let listingType = 'itemFilter(0).name=ListingType&itemFilter(0).value=FixedPrice';
        listingType += "&itemFilter(1).name=Condition&itemFilter(1).value(0)=1000&itemFilter(1).value(1)=1500&itemFilter(1).value(2)=2000&itemFilter(1).value(3)=2500&itemFilter(1).value(4)=3000";

        // assemble ebay query url
        let url = `${ebay.baseUrl}?${ebay.key}&${opName}&${ebay.opVersion}&${ebay.opFormat}&${ebay.payload}&keywords=${keywords}${categoryId}&${listingType}&${minPrice}&${maxPrice}${soldItemsOnly}&${ebay.pagination}&${ebay.siteId}`;

        //console.log(url);
        // ask ebay to return search results
        const response = await fetch(url, {
            mode: 'no-cors'
        });
        const items = await response.json();
        // active query returns item list
        // trial query is always active
        return items;

        // inactive query returns null

    } else return null;
}

/* returns all existing queries to the client via GET /api  */
async function onGet(req, res) {

    const queries = await getQueries();
    res.json({
        queries
    });

}

/* returns array of all existing queries in collection  */
async function getQueries() {

    let queries = [];
    const queryIterator = await collection.find();

    while (await queryIterator.hasNext()) {

        const query = await queryIterator.next();
        queries.push(query)
    }
    return queries;
}

app.get('/api', onGet);

/* manipulate the queries coll. or drop pastItems coll.  */
/* queryId identifies one query to change or delete      */
/* not hidden options via 'deployed'                     */

async function upsertQuery(messageBody, queryId) {

    const searchString = {
        name: queryId
    };

    let response = {};

    if (messageBody['deployed'] === 'delete') { // kill query

        response = await collection.deleteOne(searchString);
        return response;

    } else if (messageBody['deployed'] === 'drop') { // kill db

        response = await pastItems.drop();
        return response;

    } else { // otherwise, update status of entry or make a new

        const newEntry = {
            name: messageBody['name'], // query name
            keywords: messageBody['keywords'], // query words
            mPrice: messageBody['mPrice'], // min price, $
            xPrice: messageBody['xPrice'], // max price, $
            categoryID: messageBody['categoryID'], // category#
            email: messageBody['email'], // email
            deployed: messageBody['deployed'] // true/false
        };

        const params = {
            upsert: true
        };

        //console.log(`search: ${queryId}, newEntry: ${newEntry['name']} keywords: ${newEntry['keywords']} mPrice: ${newEntry['mPrice']} xPrice: ${newEntry['xPrice']} categoryID: ${newEntry['categoryID']} email: ${newEntry['email']} deployed: ${newEntry['deployed']}`);

        response = await collection.update(searchString, newEntry, params);
    }
    return response;
}

/* eBay test for query via POST: /api                    */
/* returns a list of sold items matching query params    */
async function onPost(req, res) {

    const messageBody = req.body;
    // always activate trial query

    messageBody['deployed'] = 'completed';

    const messageKeys = Object.keys(messageBody);
    console.log("POST Keys: " + messageKeys);
    // attempt search
    const searchStatus = await ebaySearch(messageBody);

    res.json(searchStatus);
}

app.post('/api', jsonParser, onPost);


/* upserts an existing DB or adds query via PATCH: /api/$qname     */
/*                                                                 */
/* Uses 7 input body fields:                                       */
/*'name', 'keywords', 'mPrice', 'xPrice', 'categoryID', 'deployed' */
/*'email'                                                          */
/* hidden options: 'deployed: delete' kills an query               */
/* hidden options: 'deployed: drop' erases old items collection    */
/* normal options: 'deployed: true' normal operation               */
/* normal options: 'deployed: no' inactive query                   */

async function onPatch(req, res) {

    const queryId = req.params.queryId;

    const messageBody = req.body;
    const messageKeys = Object.keys(messageBody);
    //console.log("query: " + queryId + " PATCH keys: " + messageKeys);
    // try upserting this entry
    const upsertStatus = await upsertQuery(messageBody, queryId);

    res.json(upsertStatus);
}

app.patch('/api/:queryId', jsonParser, onPatch);

// Test HTML route
async function onTestPath(req, res) {
    console.log("called test");
    res.sendFile(path.resolve(__dirname, 'public', 'test.html'));
}
app.get('/test', onTestPath);

// Catch route
// Must be defined after all other routes in order to be a catch-all.
async function onAllOtherPaths(req, res) {
    console.log("called index");
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));

}
app.get('/', onAllOtherPaths);


// schedule periodic ebay checks
cron.schedule('* * * * *', checkMarketPlace);
