// ===== THEME ENGINE =====
const THEMES = [
  { name: 'freezing', max: 5,   label: 'Freezing',  pct: 5  },
  { name: 'cold',     max: 15,  label: 'Cold',       pct: 20 },
  { name: 'mild',     max: 22,  label: 'Mild',       pct: 45 },
  { name: 'warm',     max: 30,  label: 'Warm',       pct: 68 },
  { name: 'hot',      max: 38,  label: 'Hot',        pct: 84 },
  { name: 'scorching',max: 999, label: 'Scorching',  pct: 100},
];

function applyTheme(tempC) {
  const theme = THEMES.find(t => tempC <= t.max) || THEMES[THEMES.length - 1];
  document.body.className = `theme-${theme.name}`;

  const fill = document.getElementById('vibeFill');
  const thumb = document.getElementById('vibeThumb');
  const label = document.getElementById('vibeLabel');

  if (fill && thumb && label) {
    fill.style.width = theme.pct + '%';
    thumb.style.left = theme.pct + '%';
    label.textContent = theme.label;
  }
}

// ===== WEATHER FETCH =====
async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) return;
  loadWeather(city);
}

window.onload = () => {
  loadRecentSearches();
  navigator.geolocation.getCurrentPosition(
    pos => loadWeather(`${pos.coords.latitude},${pos.coords.longitude}`),
    () => loadWeather('Hyderabad')
  );
};

async function loadWeather(location) {
  const loader = document.getElementById('loader');
  loader.style.display = 'block';

  try {
    const response = await fetch(
      `https://weather-app-1-8yfo.onrender.com/weather?city=${encodeURIComponent(location)}`
    );
    const data = await response.json();
    loader.style.display = 'none';

    if (data.error) {
      showToast(data.error);
      return;
    }

    const temp = data.current.temp_c;
    const loc = data.location;
    const cur = data.current;

    // Apply dynamic theme
    applyTheme(temp);

    // Save recent
    saveRecentSearch(loc.name);

    // Populate hero
    document.getElementById('city').textContent = `${loc.name}, ${loc.country}`;
    document.getElementById('condition').textContent = cur.condition.text;
    document.getElementById('temp').textContent = `${Math.round(temp)}°`;
    document.getElementById('feels').textContent = `${cur.feelslike_c}°C`;
    document.getElementById('icon').src = 'https:' + cur.condition.icon;

    // Stats
    document.getElementById('humidity').textContent = `${cur.humidity}%`;
    document.getElementById('wind').textContent = `${cur.wind_kph} km/h`;
    document.getElementById('uv').textContent = cur.uv ?? '--';
    document.getElementById('cloud').textContent = `${cur.cloud}%`;

    // Forecast
    const fc = document.getElementById('forecastContainer');
    fc.innerHTML = '';
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    data.forecast.forecastday.slice(1).forEach(day => {
      const date = new Date(day.date);
      const dayName = days[date.getDay()];
      const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      fc.innerHTML += `
        <div class="forecast-card">
          <div class="fc-day">${dayName}</div>
          <div class="fc-date">${dateStr}</div>
          <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
          <div class="fc-condition">${day.day.condition.text}</div>
          <div class="fc-temp">${Math.round(day.day.avgtemp_c)}°</div>
          <div class="fc-minmax">${Math.round(day.day.mintemp_c)}° / ${Math.round(day.day.maxtemp_c)}°</div>
        </div>
      `;
    });

    // Temp range in hero
    const todayFc = data.forecast.forecastday[0];
    if (todayFc) {
      document.getElementById('tempRange').textContent =
        `↓ ${Math.round(todayFc.day.mintemp_c)}°  ↑ ${Math.round(todayFc.day.maxtemp_c)}°`;
    }

  } catch (err) {
    loader.style.display = 'none';
    showToast('Could not load weather data.');
    console.error(err);
  }
}

// ===== RECENT SEARCHES =====
function saveRecentSearch(city) {
  let recent = JSON.parse(localStorage.getItem('recentCities') || '[]');
  recent = recent.filter(c => c !== city);
  recent.unshift(city);
  recent = recent.slice(0, 5);
  localStorage.setItem('recentCities', JSON.stringify(recent));
  loadRecentSearches();
}

function loadRecentSearches() {
  const recent = JSON.parse(localStorage.getItem('recentCities') || '[]');
  const container = document.getElementById('recentContainer');
  const row = document.getElementById('recentRow');
  container.innerHTML = '';

  if (recent.length === 0) {
    row.style.display = 'none';
    return;
  }

  row.style.display = 'flex';
  recent.forEach(city => {
    const el = document.createElement('div');
    el.className = 'recent-item';
    el.textContent = city;
    el.onclick = () => loadWeather(city);
    container.appendChild(el);
  });
}

// ===== AUTOCOMPLETE =====
const cityInput = document.getElementById('cityInput');
const suggestions = document.getElementById('suggestions');
const loader = document.getElementById('loader');

let debounceTimer;

cityInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(searchCities, 450);
});

cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') getWeather();
});

async function searchCities() {
  const query = cityInput.value.trim();
  if (query.length < 2) {
    suggestions.innerHTML = '';
    return;
  }

  loader.style.display = 'block';

  try {
    const response = await fetch(
      `https://weather-app-1-8yfo.onrender.com/search?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    suggestions.innerHTML = '';
    data.forEach(city => {
      const el = document.createElement('div');
      el.className = 'suggestion-item';
      el.innerHTML = `
        <div class="suggestion-title">📍 ${city.name}</div>
        <div class="suggestion-sub">${city.region}, ${city.country}</div>
      `;
      el.onclick = () => selectCity(city.name);
      suggestions.appendChild(el);
    });
  } catch (err) {
    console.error(err);
  }

  loader.style.display = 'none';
}

function selectCity(city) {
  cityInput.value = city;
  suggestions.innerHTML = '';
  loadWeather(city);
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper')) {
    suggestions.innerHTML = '';
  }
});

// ===== TOAST =====
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
      background: rgba(20,20,30,0.92); color: #fff; border: 1px solid rgba(255,255,255,0.1);
      padding: 14px 24px; border-radius: 50px; font-family: Outfit, sans-serif;
      font-size: 14px; z-index: 999; backdrop-filter: blur(20px);
      transition: opacity 0.4s; pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}