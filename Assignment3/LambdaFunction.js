/*
    Internet Applications Assignment 3
    Oscar O'Neill
    Student number: 17330989
    05/12/2020
*/
let currentDate = null;
let lastDate = null;
let timeSinceLast = 0;
let totalInvocations = 0;
let averageGap = 0;
let totalGaps = 0;

let json = {
    ThisInvocation: "",
    TimeSinceLast : "",
    TotalInvocationsOnThisContainer : "",
    AverageGapBetweenInvocations: ""
};

exports.handler = async (event) => {
    currentDate = new Date();
    try {
        // If the reset command is called
        if (event.queryStringParameters["cmd"] === "RESET") {
            // Edit JSON Object and reset other variables
            json = {
                ThisInvocation: ""
            };
            lastDate = currentDate;
            timeSinceLast = 0;
            totalInvocations = 0;
            totalGaps = 0;
        }
    }
    // If the reset command wasn't called
    catch(err) {
        // If this is the first call, set last date to current date for the next call
        if (totalInvocations == 0) {
            lastDate = currentDate;
        }
        
        timeSinceLast = (currentDate.getTime() - lastDate.getTime()) / 1000;
        // Tracks the sum of all gaps to then get average
        totalGaps += timeSinceLast;
        
        totalInvocations++;
        
        averageGap = totalGaps / totalInvocations;
        
        lastDate = currentDate;
        
        // Update JSON object, round numbers to two decimal places
        json.TimeSinceLast = timeSinceLast.toFixed(2);
        json.TotalInvocationsOnThisContainer = totalInvocations;
        json.AverageGapBetweenInvocations = averageGap.toFixed(2);
    }
    
    json.ThisInvocation = currentDate;
    
    // Send response with JSON object
    const response = {
        body: JSON.stringify(json)
    };
    return response;
};