# Elmer.AI

**Elmer.AI** is an AI-based web application for ham radio enthusiasts, or "hams," built with Node.js. Acting as a "virtual Elmer" (a mentor in the ham radio world), Elmer.AI advises users on the optimal ham radio bands to use at any given moment, based on real-time weather, solar, and local time data. This app combines weather and solar conditions with GPT-4 language models to deliver quick, location-based ham radio insights.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Technology Stack](#technology-stack)

## Features

- Provides current recommendations for the best ham radio bands to use, based on:
  - Real-time weather conditions (via Weatherbit API)
  - Solar activity data (via HamQSL API)
  - Local time at user location
- Uses a lightweight GPT-4 model (gpt4all) to interpret data and provide insights.
- Converts location names to GPS coordinates if latitude/longitude is not directly provided.

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** and **npm** (Node Package Manager)
- **Weatherbit API Key** (for weather data)
- **GPT4All LLM** installed on your machine (for local AI model execution)

## Installation

1. Clone this repository:
    \`\`\`bash
    git clone https://github.com/your-username/elmer-ai.git
    cd elmer-ai
    \`\`\`

2. Install dependencies:
    \`\`\`bash
    npm install
    \`\`\`

3. Set up environment variables:
    Create a \`.env\` file at the root of the project with your Weatherbit API credentials:
    \`\`\`plaintext
    WEATHERBIT_API_KEY=your_weatherbit_api_key
    WEATHERBIT_API_URL=https://api.weatherbit.io/v2.0/current
    \`\`\`

## Configuration

Ensure your \`.env\` file contains the required Weatherbit API key and URL, and specify your model details if needed.

## Usage

Start the server:
\`\`\`bash
node app.js
\`\`\`
The app will run by default on port 3000. Visit \`http://localhost:3000\` to access the web app.

## API Endpoints

- **\`GET /location\`**: Takes either \`latitude\` and \`longitude\` or a \`location\` name as query parameters and returns weather, solar, and AI-generated recommendations for ham radio bands.

### Query Parameters:

- \`latitude\` and \`longitude\`: Coordinates of the user's location.
- \`location\`: A string location name (e.g., "New York") if \`latitude\` and \`longitude\` are not provided.

### Response:
Returns a JSON object with:
  - Weather data (temperature, conditions, etc.)
  - Solar data (activity conditions)
  - Recommended HF and non-HF bands

## Technology Stack

- **Node.js** with **Express**: Core backend framework for server and API management
- **Axios**: For making HTTP requests to external APIs (Weatherbit and HamQSL)
- **xml2js**: Parses solar data from HamQSL in XML format
- **gpt4all**: Runs local language model (LLM) to generate recommendations based on combined data
- **HTML/CSS/Bootstrap**: Basic front-end for user interaction

---

**Elmer.AI** is a unique AI tool aimed at enhancing the ham radio experience by integrating data insights and delivering real-time recommendations tailored to the user’s location and radio requirements. Enjoy your ham radio adventures with Elmer by your side!
