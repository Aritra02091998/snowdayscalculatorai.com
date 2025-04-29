import requests
from datetime import datetime, timedelta

# https://geocode.maps.co/search?q=address&api_key=680f928454bd6907926580ftwca9e41

# Geocoding Addresses to get coordinates.

# Replace these with actual values.
inputAddress = "2700 Carroll Ave, Cleveland, OH 44113, United States"
geocodeApiKey = "680f928454bd6907926580ftwca9e41"



def callApiChain():

    # Geocoding API endpoint.
    geoCodingUrl = "https://geocode.maps.co/search"

    # Parameters
    params = {"q": inputAddress, "api_key": geocodeApiKey}
    response = requests.get(geoCodingUrl, params=params)

    # Check if the request was successful.
    if response.status_code == 200:
        geoCodeData = response.json()
        # print(geoCodeData) 
    else:
        print(f"Request failed with status code {response.status_code}")

    lat, lon = geoCodeData[0]['lat'], geoCodeData[0]['lon']

    # Get Forecast URL.
    # https://api.weather.gov/points/38.8894,-77.0352

    # Obtaining forcast URL - API endpoint.
    forecastUrl = "https://api.weather.gov/points/"
    forecastUrl = f'{forecastUrl}{lat},{lon}' 
    response = requests.get(forecastUrl)

    # Check if the request was successful
    if response.status_code == 200:
        weatherData = response.json()
        # print(weatherData)  
    else:
        print(f"Request failed with status code {response.status_code}")

    nextDaysforecastURL = weatherData['properties']['forecast']

    # Get actual Weather forecast
    # Make the request to the forecast URL obtained.
    response = requests.get(nextDaysforecastURL)


    # Check if the request was successful
    if response.status_code == 200:
        weatherData = response.json()
        # print(weatherData)  
    else:
        print(f"Request failed with status code {response.status_code}")

    forecasts = weatherData['properties']['periods']
    return forecasts


def calculate_snow_day_forecast(forecast_data):
    today = datetime.now().date()
    upcoming_days = [today + timedelta(days=i) for i in range(3)]  # today + next 2 days
    daily_forecasts = {}

    for period in forecast_data:
        start_time = datetime.fromisoformat(period['startTime'])
        forecast_date = start_time.date()

        if forecast_date not in upcoming_days:
            continue

        pop = period['probabilityOfPrecipitation']['value']
        pop = pop if pop is not None else 0

        forecast_text = period['shortForecast'].lower()
        snow_related = 'snow' in forecast_text or 'snowstorm' in forecast_text

        # If this date not seen yet, initialize
        if forecast_date not in daily_forecasts:
            daily_forecasts[forecast_date] = {
                'pop': pop,
                'snow_related': snow_related
            }
        else:
            # If multiple forecasts for same day, take the max probability
            daily_forecasts[forecast_date]['pop'] = max(daily_forecasts[forecast_date]['pop'], pop)
            # If any forecast mentions snow, mark it
            daily_forecasts[forecast_date]['snow_related'] = daily_forecasts[forecast_date]['snow_related'] or snow_related

    results = []
    for forecast_date in sorted(daily_forecasts.keys()):
        pop = daily_forecasts[forecast_date]['pop']
        snow_related = daily_forecasts[forecast_date]['snow_related']
        
        prediction = "Snow Storm Possible! Stay Safe!" if snow_related else "No Snow Storm. Sorry!"
        
        date_str = forecast_date.strftime("%m/%d/%Y")
        day_of_week = forecast_date.strftime("%A")
        
        result = f"{date_str} ({day_of_week}): {pop}% Precipitation Chance - {prediction}"
        results.append(result)

    return results


# Print results.
forecast_results = calculate_snow_day_forecast(callApiChain())
for forecast in forecast_results:
    print(forecast)
