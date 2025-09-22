import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import { fetchWeatherApi } from 'openmeteo';
import * as Location from 'expo-location';

export default function WeatherApp() {

  const [latitude, setLatitude] = React.useState<Number>();
  const [longitude, setLongitude] = React.useState<Number>();
  const [elevation, setElevation] = React.useState<Number>();
  const [timezone, setTimezone] = React.useState<string | null>(null);
  const [timezoneAbbreviation, setTimezoneAbbreviation] = React.useState<string | null>(null);
  const [utcOffsetSeconds, setUtcOffsetSeconds] = React.useState<Number>();
  const [weatherData, setWeatherData] = React.useState<any>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [userLocation, setUserLocation] = React.useState<{latitude: number, longitude: number} | null>(null);
  const [locationName, setLocationName] = React.useState<string>('Getting location...');

  const getUserLocation = async () => {
    try {
      // Request permission to access location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Permission to access location was denied. Using default location.',
          [{ text: 'OK' }]
        );
        setLocationName('Berlin, Germany');
        return;
      }

      // Get current position
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      // Get address from coordinates (reverse geocoding)
      try {
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (reverseGeocode[0]) {
          const address = reverseGeocode[0];
          const locationStr = `${address.city || address.subregion || 'Unknown'}, ${address.country || 'Unknown'}`;
          setLocationName(locationStr);
        } else {
          setLocationName(`${latitude.toFixed(2)}°N ${longitude.toFixed(2)}°E`);
        }
      } catch (geoError) {
        console.log('Geocoding error:', geoError);
        setLocationName(`${latitude.toFixed(2)}°N ${longitude.toFixed(2)}°E`);
      }

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your location. Using default location.',
        [{ text: 'OK' }]
      );
      setLocationName('Berlin, Germany');
    }
  };

  const fetchWeather = async () => {
    try{
      setLoading(true);
      
      // Use user location if available, otherwise use default (Berlin)
      const requestLat = userLocation?.latitude || 52.52;
      const requestLon = userLocation?.longitude || 13.41;
      
      const params = {
	"latitude": requestLat,
	"longitude": requestLon,
	"current": [
    "rain", 
    "precipitation", 
    "temperature_2m", 
    "is_day", 
    "apparent_temperature",
    "surface_pressure",
    "wind_speed_10m",
    "wind_direction_10m",
    "uv_index",
    "visibility"
  ],
	"timezone": "auto", // Automatically detect timezone based on location
};
const url = "https://api.open-meteo.com/v1/forecast";
const responses = await fetchWeatherApi(url, params);

// Process first location. Add a for-loop for multiple locations or weather models
const response = responses[0];

// Attributes for timezone and location
const lat = response.latitude();
const lon = response.longitude();
const elev = response.elevation();
const tz = response.timezone();
const tzAbbr = response.timezoneAbbreviation();
const utcOffset = response.utcOffsetSeconds();

setLatitude(lat);
setLongitude(lon);
setElevation(elev);
setTimezone(tz);
setTimezoneAbbreviation(tzAbbr);
setUtcOffsetSeconds(utcOffset);

console.log(
	`\nCoordinates: ${lat}°N ${lon}°E`,
	`\nElevation: ${elev}m asl`,
	`\nTimezone: ${tz} ${tzAbbr}`,
	`\nTimezone difference to GMT+0: ${utcOffset}s`,
);

const current = response.current()!;

// Note: The order of weather variables in the URL query and the indices below need to match!
const currentWeatherData: any = {
	current: {
    time: new Date((Number(current.time()) + Number(utcOffset)) * 1000),
		rain: current.variables(0)!.value(), // rain
		precipitation: current.variables(1)!.value(), // precipitation
		temperature_2m: current.variables(2)!.value(), // temperature_2m
		is_day: current.variables(3)!.value(), // is_day
		apparent_temperature: current.variables(4)!.value(), // apparent_temperature
		surface_pressure: current.variables(5)!.value(), // surface_pressure
		wind_speed_10m: current.variables(6)!.value(), // wind_speed_10m
		wind_direction_10m: current.variables(7)!.value(), // wind_direction_10m
		uv_index: current.variables(8)!.value(), // uv_index
		visibility: current.variables(9)!.value(), // visibility
	},
};

// Add basic sunrise/sunset estimation (simplified)
const now = new Date();
const season = now.getMonth(); // 0-11
// Basic sunrise estimation based on season and is_day status
let sunriseHour = 6; // Default 6 AM
if (season >= 3 && season <= 8) { // Spring/Summer (March-August)
  sunriseHour = 5.5;
} else { // Fall/Winter
  sunriseHour = 6.5;
}

currentWeatherData.daily = {
  sunrise: new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(sunriseHour), (sunriseHour % 1) * 60),
  sunset: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18 + (season >= 3 && season <= 8 ? 1 : -1), 30),
};

setWeatherData(currentWeatherData);

// 'currentWeatherData' now contains a simple structure with arrays with datetime and weather data
console.log(
	`\nCurrent time: ${currentWeatherData.current.time}`,
	`\nCurrent rain: ${currentWeatherData.current.rain}`,
	`\nCurrent precipitation: ${currentWeatherData.current.precipitation}`,
	`\nCurrent temperature_2m: ${currentWeatherData.current.temperature_2m}`,
	`\nCurrent is_day: ${currentWeatherData.current.is_day}`,
	`\nCurrent apparent_temperature: ${currentWeatherData.current.apparent_temperature}`,
	`\nCurrent surface_pressure: ${currentWeatherData.current.surface_pressure}`,
	`\nCurrent wind_speed_10m: ${currentWeatherData.current.wind_speed_10m}`,
	`\nCurrent wind_direction_10m: ${currentWeatherData.current.wind_direction_10m}`,
	`\nCurrent uv_index: ${currentWeatherData.current.uv_index}`,
	`\nCurrent visibility: ${currentWeatherData.current.visibility}`,
	`\nEstimated sunrise: ${currentWeatherData.daily?.sunrise}`,
);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      await getUserLocation();
    };
    initializeApp();
  }, []);

  // Fetch weather when user location changes
  useEffect(() => {
    if (userLocation) {
      fetchWeather();
    } else {
      // If no location after initial load, fetch with default location
      const timer = setTimeout(() => {
        fetchWeather();
      }, 3000); // Wait 3 seconds for location, then use default
      return () => clearTimeout(timer);
    }
  }, [userLocation]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontWeight: '500' }}>Today</Text>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
              {locationName}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.locationButton}
            activeOpacity={0.7}
            onPress={async () => {
              await getUserLocation();
              if (userLocation) {
                fetchWeather();
              }
            }}
          >
            <FontAwesome name={loading ? "refresh" : "map-marker"} size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Main Weather Section - Centered */}
        <View style={styles.mainWeather}>
          {/* Weather Icon */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={styles.weatherIcon}>
              <FontAwesome 
                name={weatherData.current?.is_day ? "sun-o" : "moon-o"} 
                size={120} 
                color={weatherData.current?.is_day ? "#FCD34D" : "#E5E7EB"} 
              />
            </View>
            
            {/* Temperature */}
            <Text style={styles.temperature}>
              {weatherData.current?.temperature_2m ? Math.round(weatherData.current.temperature_2m) : '--'}°
            </Text>
            
            {/* Weather Condition */}
            <Text style={styles.condition}>
              {weatherData.current?.is_day ? 'Sunny' : 'Clear Night'}
            </Text>
            
            {/* Feels Like */}
            <Text style={styles.feelsLike}>
              Feels like {weatherData.current?.apparent_temperature ? Math.round(weatherData.current.apparent_temperature) : '--'}°
            </Text>
          </View>

          {/* Weather Details Cards */}
          <View style={{ width: '100%', maxWidth: 400 }}>
            <View style={styles.detailsCard}>
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <FontAwesome name="eye" size={20} color="white" />
                  </View>
                  <Text style={styles.detailLabel}>
                    Visibility
                  </Text>
                  <Text style={styles.detailValue}>
                    {weatherData.current?.visibility ? `${(weatherData.current.visibility / 1000).toFixed(1)} km` : '--'}
                  </Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <FontAwesome name="tint" size={20} color="white" />
                  </View>
                  <Text style={styles.detailLabel}>
                    Rain
                  </Text>
                  <Text style={styles.detailValue}>
                    {weatherData.current?.rain ? `${weatherData.current.rain} mm` : '0 mm'}
                  </Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <FontAwesome name="location-arrow" size={20} color="white" />
                  </View>
                  <Text style={styles.detailLabel}>
                    Wind
                  </Text>
                  <Text style={styles.detailValue}>
                    {weatherData.current?.wind_speed_10m ? `${Math.round(weatherData.current.wind_speed_10m)} km/h` : '0 km/h'}
                  </Text>
                </View>
              </View>

            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Fallback styles in case Tailwind doesn't work
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6', // Blue fallback
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  locationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 50,
  },
  mainWeather: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  weatherIcon: {
    backgroundColor: 'rgba(252, 211, 77, 0.2)',
    borderRadius: 50,
    padding: 32,
    marginBottom: 24,
  },
  temperature: {
    color: 'white',
    fontSize: 96,
    fontWeight: '100',
    marginBottom: 8,
  },
  condition: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 4,
  },
  feelsLike: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  additionalDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 24,
  },
  additionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  additionalLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginLeft: 8,
  },
  additionalValue: {
    color: 'white',
    fontWeight: '500',
  },
  forecastButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 48,
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 12,
    marginRight: 'auto',
  },
});
