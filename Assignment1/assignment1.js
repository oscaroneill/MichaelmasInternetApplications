/*
    Internet Applications Assignment 1
    Oscar O'Neill
    Student number: 17330989
    07/11/2020
*/
const express = require('express')
const app = express()
const port = 3000
const path=require("path")
let publicPath= path.resolve(__dirname,"public")
app.use(express.static(publicPath));
// Grab fetch package
const fetch = require("node-fetch");

app.listen(port, () => console.log(`App listening on port ${port}!`));

app.get('/weather/:city', processWeather);

function processWeather(req, res) {
    // Grab weather with given city name
    let cityName = req.params.city;
    fetch(createURL(cityName))
    // Grab response JSON
    .then(response => (response.json()))
    .then(data => {
        if (data.message == 'city not found') {
            // If city doesn't exist, create new JSON object with error data
            res.json({error : "City not found.", packForRain:null, packForTemp:null, list:[]})
        } else {
            // Create new JSON object with given JSON data
            let jsonResult = makeSummary(data.list);
            jsonResult.packForRain = packForRain(data.list);
            jsonResult.packForTemp = packForTemp(data.list);
            // Return JSON result
            res.json(jsonResult);
        }
    })
    .catch(err => console.log(err));
}

// Create API URL with given city
function createURL(cityName) {
    return "https://api.openweathermap.org/data/2.5/forecast?q="+cityName+"&APPID=3e2d927d4f28b456c6bc662f34350957&units=metric"
}

function packForRain(weather) {
    var condition;
    // Grab the weather condition for each three hour period over the next five days
    for(var threeHour in weather) {
        condition = weather[threeHour].weather[0].main;
        // If any of the three hour periods has rain, tell user to bring umbrella
        if (condition == 'Drizzle' || condition == 'Rain' || condition == 'Thunderstorm') {
            return "PACK AN UMBRELLA";
        }
    }
    return "DON'T PACK AN UMBRELLA";
}

function packForTemp(weather) {
    var currentMinTemp;
    var topMinTemp = Infinity;
    // Find the minimum temperature over the next five days
    for(var threeHour in weather) {
        currentMinTemp = weather[threeHour].main.temp_min;
        if (currentMinTemp < topMinTemp) {
            topMinTemp = currentMinTemp;
        }
    }
    // Return general temperature based on minimum
    if (topMinTemp < 10) {
        return "COLD"
    } else if (topMinTemp < 20) {
        return "WARM"
    } else {
        return "HOT"
    }
}

function makeSummary(weather) {
    // Create JSON object for summary data
    var jsonStr = '{"error:{null}, packForRain":{}, "packForTemp":{}, "list":[]}';
    var jsonObj = JSON.parse(jsonStr);

    for(var threeHour in weather) {
        // Grab data for this three hour period
        var dateTime = weather[threeHour].dt_txt;
        var tempRange = weather[threeHour].main.temp_min + "-" + weather[threeHour].main.temp_max;
        var windSpeed = weather[threeHour].wind.speed;
        var rainLevel;
        if (weather[threeHour].rain != null) {
            rainLevel = weather[threeHour].rain['3h'];
        } else {
            rainLevel = "ZERO";
        }

        // Push it to the JSON array
        jsonObj['list'].push({"dateTime":dateTime,"tempRange":tempRange, "windSpeed":windSpeed, "rainLevel":rainLevel});
    }
    return jsonObj;
}