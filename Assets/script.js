// Select elements from DOM
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const dayContainer = document.querySelector('#today');
const forecastContainer = document.querySelector('#forecast');
const historyContainer  = document.querySelector('#history');

// define global variables
let searchHistory = [];
let weatherApiRootUrl = 'https://api.openweathermap.org';
let weatherApiKey = 'ab47155e2b2b34926db83c4d2fbd0cd5';

// Add timezone plugins to day.js
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

// Function to display the search history
function renderSearchHistory() {
  historyContainer .innerHTML = '';

  // Loop through the search history array from the end and create a button for each item
  for (let i = searchHistory.length - 1; i >= 0; i--) {
    var btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-controls', 'today forecast');
    btn.classList.add('history-btn', 'btn-history');

   // Set the data-search attribute to the city name
    btn.setAttribute('data-search', searchHistory[i]);
    btn.textContent = searchHistory[i];
    historyContainer .append(btn);
  }
}

// Function to add a search term to the search history array and display the updated list
function appendToHistory(search) {
  // If there is no search term return the function
  if (searchHistory.indexOf(search) !== -1) {
    return;
  }
  searchHistory.push(search);

  localStorage.setItem('search-history', JSON.stringify(searchHistory));
  renderSearchHistory();
}

// Function to get search history from local storage
function startSearchHistory() {
  let storedHistory = localStorage.getItem('search-history');
  if (storedHistory) {
    searchHistory = JSON.parse(storedHistory);
  }
  renderSearchHistory();
}

// Function to display the current weather data fetched from OpenWeather api.
function renderCurrentWeather(city, weather) {
  let date = dayjs().format('M/D/YYYY');
  // Store the response data from the fetch request in variables
  let tempF = weather.main.temp;
  let windMph = weather.wind.speed;
  let humidity = weather.main.humidity;
  let iconUrl = `https://openweathermap.org/img/w/${weather.weather[0].icon}.png`;
  let iconDescription = weather.weather[0].description || weather[0].main;

  let card = document.createElement('div');
  let cardBody = document.createElement('div');
  let heading = document.createElement('h2');
  let weatherIcon = document.createElement('img');
  let tempEl = document.createElement('p');
  let windEl = document.createElement('p');
  let humidityEl = document.createElement('p');

  card.setAttribute('class', 'card');
  cardBody.setAttribute('class', 'card-body');
  card.append(cardBody);

  heading.setAttribute('class', 'h3 card-title');
  tempEl.setAttribute('class', 'card-text');
  windEl.setAttribute('class', 'card-text');
  humidityEl.setAttribute('class', 'card-text');

  heading.textContent = `${city} (${date})`;
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  weatherIcon.setAttribute('class', 'weather-img');
  heading.append(weatherIcon);
  tempEl.textContent = `Temp: ${tempF}°F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;
  cardBody.append(heading, tempEl, windEl, humidityEl);

  dayContainer.innerHTML = '';
  dayContainer.append(card);
}

// Function to display forecast card given an object from api
// daily forecast.
function renderForecastCard(forecast) {
  // variables for data from api
  let iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
  let iconDescription = forecast.weather[0].description;
  let tempF = forecast.main.temp;
  let humidity = forecast.main.humidity;
  let windMph = forecast.wind.speed;

  // Create elements for a card
  let col = document.createElement('div');
  let card = document.createElement('div');
  let cardBody = document.createElement('div');
  let cardTitle = document.createElement('h5');
  let weatherIcon = document.createElement('img');
  let tempEl = document.createElement('p');
  let windEl = document.createElement('p');
  let humidityEl = document.createElement('p');

  col.append(card);
  card.append(cardBody);
  cardBody.append(cardTitle, weatherIcon, tempEl, windEl, humidityEl);

  col.setAttribute('class', 'col-md');
  col.classList.add('five-day-card');
  card.setAttribute('class', 'card bg-primary h-100 text-white');
  cardBody.setAttribute('class', 'card-body p-2');
  cardTitle.setAttribute('class', 'card-title');
  tempEl.setAttribute('class', 'card-text');
  windEl.setAttribute('class', 'card-text');
  humidityEl.setAttribute('class', 'card-text');

  // Add content to elements
  cardTitle.textContent = dayjs(forecast.dt_txt).format('M/D/YYYY');
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  tempEl.textContent = `Temp: ${tempF} °F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  forecastContainer.append(col);
}

// Function to display 5 day forecast.
function renderForecast(dailyForecast) {
  // Create unix timestamps for start and end of 5 day forecast
  let startDt = dayjs().add(1, 'day').startOf('day').unix();
  let endDt = dayjs().add(6, 'day').startOf('day').unix();

  let headingCol = document.createElement('div');
  let heading = document.createElement('h4');

  headingCol.setAttribute('class', 'col-12');
  heading.textContent = '5-Day Forecast:';
  headingCol.append(heading);

  forecastContainer.innerHTML = '';
  forecastContainer.append(headingCol);

  for (let i = 0; i < dailyForecast.length; i++) {

    // First filters through all of the data and returns only data that falls between one day after the current data and up to 5 days later.
    if (dailyForecast[i].dt >= startDt && dailyForecast[i].dt < endDt) {

      // Then filters through the data and returns only data captured at noon for each day.
      if (dailyForecast[i].dt_txt.slice(11, 13) == "12") {
        renderForecastCard(dailyForecast[i]);
      }
    }
  }
}

function renderItems(city, data) {
  renderCurrentWeather(city, data.list[0], data.city.timezone);
  renderForecast(data.list);
}

// Fetches weather data for a location from the OpenWeather API, then calls functions to display the current and 5-day forecast.
function fetchWeather(location) {
  let { lat } = location;
  let { lon } = location;
  let city = location.name;

  let apiUrl = `${weatherApiRootUrl}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      renderItems(city, data);
    })
    .catch(function (err) {
      console.error(err);
    });
}

function fetchCoords(search) {
  let encodedSearch = search.replace(/ /g, '+');
  let apiUrl = `${weatherApiRootUrl}/geo/1.0/direct?q=${encodedSearch}&limit=5&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data[0]) {
        alert('Location not found');
      } else {
        appendToHistory(search);
        fetchWeather(data[0]);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

function handleSearchFormSubmit(e) {
  // Don't continue if there is nothing in the search form
  if (!searchInput.value) {
    return;
  }

  e.preventDefault();
  let search = searchInput.value.trim();
  fetchCoords(search);
  searchInput.value = '';
}

function handleSearchHistoryClick(e) {
  // Don't do search if current elements is not a search history button
  if (!e.target.matches('.btn-history')) {
    return;
  }

  let btn = e.target;
  let search = btn.getAttribute('data-search');
  fetchCoords(search);
}

startSearchHistory();
searchForm.addEventListener('submit', handleSearchFormSubmit);
historyContainer .addEventListener('click', handleSearchHistoryClick);
