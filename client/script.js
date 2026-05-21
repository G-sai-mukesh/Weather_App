async function getWeather() {

    const city = document.getElementById("cityInput").value;

    if (!city) {

        alert("Enter city name");
        return;

    }

    loadWeather(city);
}

// AUTO LOCATION WEATHER

window.onload = () => {

    navigator.geolocation.getCurrentPosition(

        (position) => {

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            loadWeather(`${lat},${lon}`);

        },

        (error) => {

            console.log(error);

            // Fallback

            loadWeather("Hyderabad");

        }

    );

};

// LOAD WEATHER

async function loadWeather(location) {

    try {

        const response = await fetch(
            `http://localhost:5000/weather?city=${location}`
        );

        const data = await response.json();

        console.log(data);

        if (data.error) {

            alert(data.error);
            return;

        }

        // SAVE RECENT SEARCH

        saveRecentSearch(data.location.name);

        // CURRENT WEATHER

        document.getElementById("temp").innerHTML =
            `${data.current.temp_c}°C`;

        document.getElementById("city").innerHTML =
            `${data.location.name}, ${data.location.country}`;

        document.getElementById("condition").innerHTML =
            data.current.condition.text;

        document.getElementById("humidity").innerHTML =
            `${data.current.humidity}%`;

        document.getElementById("wind").innerHTML =
            `${data.current.wind_kph} km/h`;

        document.getElementById("feels").innerHTML =
            `${data.current.feelslike_c}°C`;

        document.getElementById("icon").src =
            "https:" + data.current.condition.icon;

        // FORECAST

        const forecastContainer =
            document.getElementById("forecastContainer");

        forecastContainer.innerHTML = "";

        data.forecast.forecastday
            .slice(1)
            .forEach(day => {

                forecastContainer.innerHTML += `

                    <div class="forecast-card">

                        <h3>${day.date}</h3>

                        <img
                            src="https:${day.day.condition.icon}"
                        >

                        <p>
                            ${day.day.condition.text}
                        </p>

                        <h2>
                            ${day.day.avgtemp_c}°C
                        </h2>

                    </div>

                `;
            });

    } catch (error) {

        console.log(error);

        alert("Failed to load weather");

    }

}

// SEARCH SYSTEM

const cityInput =
    document.getElementById("cityInput");

const suggestions =
    document.getElementById("suggestions");

const loader =
    document.getElementById("loader");

const recentContainer =
    document.getElementById("recentContainer");

let debounceTimer;

// LOAD RECENT SEARCHES

loadRecentSearches();

function saveRecentSearch(city) {

    let recent =
        JSON.parse(
            localStorage.getItem("recentCities")
        ) || [];

    recent =
        recent.filter(item => item !== city);

    recent.unshift(city);

    recent = recent.slice(0, 5);

    localStorage.setItem(
        "recentCities",
        JSON.stringify(recent)
    );

    loadRecentSearches();
}

function loadRecentSearches() {

    const recent =
        JSON.parse(
            localStorage.getItem("recentCities")
        ) || [];

    recentContainer.innerHTML = "";

    recent.forEach(city => {

        recentContainer.innerHTML += `

            <div
                class="recent-item"
                onclick="loadWeather('${city}')"
            >
                ${city}
            </div>

        `;
    });
}

// DEBOUNCED SEARCH

cityInput.addEventListener("input", () => {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {

        searchCities();

    }, 500);

});

// SEARCH CITIES

async function searchCities() {

    const query = cityInput.value;

    if (query.length < 2) {

        suggestions.innerHTML = "";
        return;

    }

    loader.style.display = "block";

    try {

        const response = await fetch(
            `http://localhost:5000/search?q=${query}`
        );

        const data = await response.json();

        suggestions.innerHTML = "";

        data.forEach(city => {

            suggestions.innerHTML += `

                <div
                    class="suggestion-item"
                    onclick="selectCity('${city.name}')"
                >

                    <div class="suggestion-title">

                        📍 ${city.name}

                    </div>

                    <div class="suggestion-sub">

                        ${city.region}, ${city.country}

                    </div>

                </div>

            `;
        });

    } catch (error) {

        console.log(error);

    }

    loader.style.display = "none";
}

// SELECT CITY

function selectCity(city) {

    cityInput.value = city;

    suggestions.innerHTML = "";

    loadWeather(city);
}

// HIDE SUGGESTIONS

document.addEventListener("click", (e) => {

    if (!e.target.closest(".search-wrapper")) {

        suggestions.innerHTML = "";

    }

});