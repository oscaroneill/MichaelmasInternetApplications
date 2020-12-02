/*
    Internet Applications Assignment 2
    Oscar O'Neill
    Student number: 17330989
    02/12/2020
*/
const express = require('express');
const app = express();
const port = 3000;
const path = require("path");
let publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));
// Grab fetch package
const fetch = require("node-fetch");

app.listen(port, () => console.log(`App listening on port ${port}!`));

app.get('/create', createDatabase);
app.get('/query/:year/:name', queryDatabase);
app.get('/destroy', destroyDatabase);

// Send html as default
app.get('/', (req, res) => {
    res.sendFile('public/assignment2.html', {root: __dirname})
})

/* - CREATE - */
/*
Make a table in a DynamoDB database.
Fetch the raw data from the S3 object.
Upload it to the newly created database.
*/
function createDatabase(req, res) {
    // Set up AWS and DynamoDB
    var AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});
    var dynamodb = new AWS.DynamoDB();

    // Specify movie parameters for the table
    var params = {
        TableName : "Movies",
        KeySchema: [       
            { AttributeName: "year", KeyType: "HASH"},  // Partition key
            { AttributeName: "title", KeyType: "RANGE" }  // Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "year", AttributeType: "N" },
            { AttributeName: "title", AttributeType: "S" }
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 5, 
            WriteCapacityUnits: 5
        }
    };

    // Create the table
    dynamodb.createTable(params, function(err, data) {
        if (err) {
            console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });

    // Fetch movie data from the S3 object, with a 5 second delay to give DynamoDB a chance to create the table
    let p = new Promise((res) => {
        setTimeout(() => {
            // Fetch S3 data
            const s3 = new AWS.S3();
            let objectData = null;
            var getParams = {
                Bucket: 'csu44000assign2useast20',
                Key: 'moviedata.json'
            }

            s3.getObject(getParams, function(err, data) {
                if (err) {
                    return err;
                }

                objectData = data.Body.toString('utf-8');
                var jsonData = JSON.parse(objectData);
                var docClient = new AWS.DynamoDB.DocumentClient();
                
                // Add data to database
                console.log("Importing movies into DynamoDB. Please wait.");
                jsonData.forEach(function(movie) {
                    var params = {
                        TableName: "Movies",
                        Item: {
                            "year":  movie.year,
                            "title": movie.title,
                            "info":  movie.info
                        }
                    };

                    docClient.put(params, function(err, data) {
                        if (err) {
                            console.error("Unable to add movie", movie.title, ". Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("PutItem succeeded:", movie.title);
                        }
                    });
                });
            });
        }, 5000);
    });
}

/* - QUERY - */
/*
Find all the movies in a given year, that begin with the entered text string.
Display them on the webpage.
*/
function queryDatabase(req, res) {
    // Grab user input
    let userYear = req.params.year;
    let userMovie = req.params.name;
    
    console.log("-QUERYING-");
    console.log("-YEAR: " + userYear + "-");
    console.log("-MOVIE: " + userMovie + "-");
    
    var AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});
    var docClient = new AWS.DynamoDB.DocumentClient();

    // Set up parameters for querying
    var params = {
        TableName : "Movies",
        ProjectionExpression:"#yr, title",
        KeyConditionExpression: "#yr = :yyyy and begins_with ( title, :letter1 )",
        ExpressionAttributeNames:{
            "#yr": "year"
        },
        ExpressionAttributeValues: {
            ":yyyy": parseInt(userYear),
            ":letter1": userMovie
        }
    };

    // Create return JSON object
    var jsonStr = '{"list":[]}';
    var jsonObj = JSON.parse(jsonStr);

    // Make query
    docClient.query(params, function(err, data) {
        if (err) {
            console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("Query succeeded.");
            data.Items.forEach(function(item) {
                // Push the movie to the JSON array
                jsonObj['list'].push({"movieName":JSON.stringify(item.title)});
                console.log(" -", item.year + ": " + item.title);
            });
        }
        // Return the list of movies
        res.json(jsonObj);
    });
}

/* - DESTROY - */
/*
Delete the database table.
*/
function destroyDatabase(req, res) {
    var AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});
    var dynamodb = new AWS.DynamoDB();

    var params = {
        TableName : "Movies"
    };

    dynamodb.deleteTable(params, function(err, data) {
        if (err) {
            console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });
}