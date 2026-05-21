const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
require("dotenv").config();
const API_KEY = process.env.WEATHER_API_KEY;

// Weather Route

app.get("/weather", async (req, res) => {

    try {

        const city = req.query.city;

        if (!city) {

            return res.status(400).json({
                error: "City is required"
            });

        }

        const url =
            `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=4&aqi=yes&alerts=yes`;

        const response = await axios.get(url);

        res.json(response.data);

    } catch (error) {

        console.log(error.response?.data || error.message);

        res.status(500).json({
            error: "Failed to fetch weather"
        });

    }

});

// Search Suggestions Route

app.get("/search", async (req, res) => {

    try {

        const query = req.query.q;

        if (!query) {

            return res.json([]);

        }

        const response = await axios.get(
            `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`
        );

        const indianCities = response.data.filter(
            city => city.country === "India"
        );

        res.json(indianCities);

    } catch (error) {

        console.log(error.message);

        res.status(500).json({
            error: "Search failed"
        });

    }

});

app.listen(5000, () => {

    console.log("Server running on port 5000");

});