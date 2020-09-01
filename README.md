# ebayTrader: MongoDB Backend

Behavior overview:

(a) User configures queries that capture a target set of filters. Previous history of eBay auctions can be pulled to verify how well-target the filter(s) are.

(b) backend stores queries and periodically runs them against ebay API (every minute). All newly found items are e-mail to the user with gmail SMTP relay.

(c) backend keeps track of the items already sent to the user, so dups are never e-mailed.

DB organization: database for queries and database for seen items.


Backend specs: 

Server side processes JSON queries for eBay API calls and runs periodic crontab
jobs to check if there are new items matching the search parameters.

Query format:
(1) Mandatory text field: name
(2) Mandatory text field: ebay search keywords (normal syntax including +/- etc)
(3) Mandatory text field: minimum price
(4) Mandatory text field: maximum price 
(5) Optional text field: ebay category ID
(6) Mandatory text field: email
(7) Mandatory text field: deployed (options true/false/delete/drop)

deployed field behavior:
true - query is active and runs in crontab
false - query exists but is inactive
delete - query is deleted from database
drop - database of seen items is dropped (all searches continue running anew)


JSON API:

API Path /api
method: GET

Action: returns a list of configured queries, does not update DB 
For example:

{
  "queries": [
    {
      "_id": "592d131e4a7ca13801ceb2bf",
      "name": "retina",
      "keywords": "macbook retina",
      "mPrice": "100",
      "xPrice": "1000",
      "categoryID": "175672",
      "email": "dkharito@stanford.edu",
      "deployed": "false"
    },
    {
      "_id": "592df9364a7ca13801ceb569",
      "name": "touchbar",
      "keywords": "macbook touchbar -read",
      "mPrice": "400",
      "xPrice": "1200",
      "categoryID": "175672",
      "email": "dkharitonov@yahoo.com",
      "deployed": "true"
    }
  ]
}

API Path /api/:name
method: POST

Udpdates an existing query/renames or creates a new one, saving into DB. 
All fields are required except categoryID

body fields
      "name"
      "keywords"
      "mPrice"
      "xPrice"
      "categoryID"
      "email"
      "deployed"



API Path /api
method: POST

returns eBay query result for previously sold items matching the query parametea. This query does not have to exist in the database and is not saved.

body fields
      "name"
      "keywords"
      "mPrice"
      "xPrice"
      "categoryID"
      "email"
      "deployed"








crontab behavior:




KNOWN CAVEATS:

1) Heroku puts an app to sleep if no frontend activity, which suspends crontab. This means the queries are active for few minutes after acessing the backend and then search stops.

This is not an issue for locally configured node.js and mongodb setup.

2) gmail (google SMTP relay) is picky about source addresses. Sometimes Heroku moves services around, which might trigger Gmail auth errors resolvable via Gmail web interface. 

This is not an issue for locally configured server as it has a permanent IP.

3) eBay limits the number of responses per second in free API accounts. This means that if a query returns many items and/or there are many queries configured, some may not result in a valid JSON from eBay. I have not added an exception handler for this as scaling is not a goal for this project.



