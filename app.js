//module imports
const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cache = require('express-cache-controller');
require('dotenv').config();

//weatherbit api process env imports
const WEATHERBIT_API_KEY = process.env.WEATHERBIT_API_KEY;
const WEATHERBIT_API_URL = process.env.WEATHERBIT_API_URL;

//gpt4all loading llama model
const { createCompletion, loadModel } = require("gpt4all");
const MODEL_FILE = "q4_0-orca-mini-3b.gguf"; // Fixed model file

//express web server config
const app = express();
const PORT = process.env.PORT || 3000;

// Cache all responses for 100 seconds
app.use(cache({ maxAge: 86400 }));

// Function to convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius) {
    return (celsius * (9 / 5)) + 32;
};

/**
 * Get the best ham radio bands to use based on the provided weather information.
 * @param {string} prompt - The prompt to send to the model.
 * @returns {Promise<string>} - A promise that resolves to the response message from the model.
 */
async function getBestHamRadioBands(prompt, callback) {
    // Load the model
    const model = await loadModel(MODEL_FILE, {
        device: 'cpu', // Or 'gpu' if available
        nCtx: 1500,    // Reduce context to 1024 for faster processing
        ngl: 80        // Slightly reduce no-gradient layers for performance gain
    });

    // Create a chat session
    const chat = await model.createChatSession({
        temperature: 0.8,
    });

    // Create a completion using the provided prompt
    const res1 = await createCompletion(chat, prompt);
    console.debug(res1.choices[0].message);

    // Dispose the model to free resources
    model.dispose();

    // Return the assistant's response
    return res1.choices[0].message;
}

/**
 * Call the function with the given prompt.
 * @param {string} prompt - The prompt to send to the model.
 */
function callGetBestHamRadioBands(prompt, callback) {
    getBestHamRadioBands(prompt)
        .then(bestBands => {
            console.log("Best Ham Radio Bands:", bestBands);
            callback(bestBands);
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint to get weather and solar data
app.get('/location', async (req, res) => {
    const { latitude, longitude, location } = req.query;

    let lat, long;

    // Check if latitude and longitude are provided directly
    if (latitude && longitude) {
        lat = parseFloat(latitude);
        long = parseFloat(longitude);
    } else if (location) {
        // If location is provided, use a geocoding API to get lat/long (e.g., Nominatim)
        try {
            const geocodeResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: location,
                    format: 'json',
                    limit: 1,
                },
                headers: {
                    'User-Agent': 'YourAppName/1.0 (your.email@example.com)', // Replace with your app name and contact
                },
            });

            const results = geocodeResponse.data;
            if (results.length > 0) {
                lat = results[0].lat;
                long = results[0].lon;
            } else {
                return res.status(404).json({ error: 'Location not found' });
            }
        } catch (error) {
            console.error('Error fetching geocoding data:', error.message);
            return res.status(500).json({ error: 'Unable to retrieve location data' });
        }
    } else {
        return res.status(400).json({ error: 'Either latitude/longitude or location name must be provided' });
    }

    // Log the resolved latitude and longitude
    console.log(`Resolved Latitude: ${lat}, Longitude: ${long}`);

    // Fetch current weather data from Weatherbit
    try {
        const weatherResponse = await axios.get(WEATHERBIT_API_URL, {
            params: {
                lat: lat,
                lon: long,
                key: WEATHERBIT_API_KEY,
            },
        });

        const weatherData = weatherResponse.data;

        const currentWeather = {
            ...(location ? { location } : {}), // Conditionally include location if it exists
            description: weatherData.data[0].weather.description, // e.g., "Clear"
            temperature: celsiusToFahrenheit(weatherData.data[0].temp), // Current temperature
            timezone: weatherData.data[0].timezone, // Timezone from Weatherbit
            time: weatherData.data[0].ob_time + " UTC", // Observation time from Weatherbit
            clouds: weatherData.data[0].clouds,//cloud coverage
            dewPoint: weatherData.data[0].dewpt,//dew point
            windDirection: weatherData.data[0].wind_dir,//wind direction
            windSpeed: weatherData.data[0].wind_spd,//wind speed
            data: weatherData.data[0]//attatches full data object in case a
        };

        // Fetch local time data from WorldTimeAPI using the timezone from Weatherbit
        try {
            const currentUtcDate = new Date().toISOString();
            const localTimeData = {
                datetime: currentUtcDate, // Current UTC date in ISO format
                timezone: 'UTC',          // Specify that this is UTC
                utc_offset: '±00:00'      // UTC offset
            };

            // Include local time in the response
            const finalResponse = {
                latitude: lat,
                longitude: long,
                currentWeather: {
                    ...currentWeather,
                    localTime: localTimeData.datetime, // Local time from WorldTimeAPI
                },
            };

            // Fetch solar data from HamQSL
            try {
                const solarResponse = await axios.get('https://www.hamqsl.com/solarxml.php');
                const parser = new xml2js.Parser();

                // Parse the XML response to JSON
                parser.parseString(solarResponse.data, (err, result) => {
                    if (err) {
                        console.error('Error parsing solar XML data:', err);
                        return res.status(500).json({ error: 'Unable to retrieve solar data' });
                    }

                    // Add solar data to the response
                    finalResponse.solarData = result;

                    // Prepare the query for OpenAI
                    const query = "You are a HAM radio AI assistant.  You will review the following useful local ham radio data of this user. You will look at the solar conditions, the weather, and all other included information of the following json object and in 1-2 sentences you will tell me the best ham radio bands to use right now. " + JSON.stringify(finalResponse);

                    callGetBestHamRadioBands(query, function(response){
                        res.send(JSON.stringify(response));
                    })

                });
            } catch (error) {
                console.error('Error fetching solar data:', error.message);
                return res.status(500).json({ error: 'Unable to retrieve solar data' });
            }
        } catch (error) {
            console.error('Error fetching local time data:', error.message);
            return res.status(500).json({ error: 'Unable to retrieve local time data' });
        }
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        res.status(500).json({ error: 'Unable to retrieve weather data' });
    }
});

app.listen(PORT, () => {
    console.log(`Elmer.AI server is running on port ${PORT}`);
});
