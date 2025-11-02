import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';

export default function WeatherApp() {

    const [weatherData, setWeatherData] = React.useState<any>({});
    const [loading, setLoading] = React.useState<boolean>(false);
    const [locationName, setLocationName] = React.useState<string>('Getting location...');
    const [userLocation, setUserLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
    const [latitude, setLatitude] = React.useState<number | null>(null);
    const [longitude, setLongitude] = React.useState<number | null>(null);
    const [elevation, setElevation] = React.useState<number | null>(null);
    const [timezone, setTimezone] = React.useState<string | null>(null);
    const [timezoneAbbreviation, setTimezoneAbbreviation] = React.useState<string | null>(null);
    const [utcOffsetSeconds, setUtcOffsetSeconds] = React.useState<number | null>(null);

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

            return { latitude, longitude };

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

    const handleRefresh = async () => {
        // Refresh logic here
        // Mock Data for testing
        // if(!weatherData.current?.is_day) {
        //     setWeatherData({
        //     current: {
        //         is_day: true,
        //         temperature_2m: 25,
        //         apparent_temperature: 27,
        //         visibility: 10000,
        //         rain: 0,
        //         wind_speed_10m: 15,
        //     },
        //     });
        //     setLocationName('Itanhaém');
        //     setLoading(false);
        // } else {
        //     setWeatherData({
        //     current: {
        //         is_day: false,
        //         temperature_2m: 18,
        //         apparent_temperature: 16,
        //         visibility: 8000,
        //         rain: 2,
        //         wind_speed_10m: 10,
        //     },
        //     });
        //     setLocationName('Japan');
        //     setLoading(false);
        // }

        // Actual refresh
        setLoading(true);
        const location = await getUserLocation();
        updateWeather(location?.latitude, location?.longitude);
    }

    const handleAllowLocation = async () => {
        // Logic to get location and fetch weather data
        console.log("Location permission granted");
        const location = await getUserLocation();
        updateWeather(location?.latitude, location?.longitude);

        console.log(location);
    }

    const updateWeather = async (latitude?: number, longitude?: number) => {
        try {
            setLoading(true);

            // Use user location if available, otherwise use default (Berlin)
            const requestLat = latitude || userLocation?.latitude || 52.52;
            const requestLon = longitude || userLocation?.longitude || 13.41;

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
                ],"timezone": "auto", // Automatically detect timezone based on location
            };
        const url = "https://api.open-meteo.com/v1/forecast";
        // const responses = await fetchWeatherApi(url, params);

        const responses = await axios.get(url, { params });

        // Process first location. Add a for-loop for multiple locations or weather models
        const response = responses.data;

        console.log("Response: ", response);

        // Attributes for timezone and location
        const lat = response.latitude;
        const lon = response.longitude;
        const elev = response.elevation;
        const tz = response.timezone;
        const tzAbbr = response.timezoneAbbreviation;
        const utcOffset = response.utcOffsetSeconds;

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

        const current = response.current;
        // {"current": {"apparent_temperature": 24.9, "interval": 900, "is_day": 1, "precipitation": 0, "rain": 0, "surface_pressure": 1009.9, "temperature_2m": 21.6, "time": "2025-11-02T16:45", "uv_index": 1.85, "visibility": 24140, "wind_direction_10m": 130, "wind_speed_10m": 5.6}, "current_units": {"apparent_temperature": "°C", "interval": "seconds", "is_day": "", "precipitation": "mm", "rain": "mm", "surface_pressure": "hPa", "temperature_2m": "°C", "time": "iso8601", "uv_index": "", "visibility": "m", "wind_direction_10m": "°", "wind_speed_10m": "km/h"}, "elevation": 4, "generationtime_ms": 0.1512765884399414, "latitude": -24.25, "longitude": -46.875, "timezone": "America/Sao_Paulo", "timezone_abbreviation": "GMT-3", "utc_offset_seconds": -10800}

        // Note: The order of weather variables in the URL query and the indices below need to match!
        const currentWeatherData: any = {
            current: {
            time: new Date((Number(current.time) + Number(utcOffset)) * 1000),
                rain: current.rain, // rain
                precipitation: current.precipitation, // precipitation
                temperature_2m: current.temperature_2m, // temperature_2m
                is_day: current.is_day, // is_day
                apparent_temperature: current.apparent_temperature, // apparent_temperature
                surface_pressure: current.surface_pressure, // surface_pressure
                wind_speed_10m: current.wind_speed_10m, // wind_speed_10m
                wind_direction_10m: current.wind_direction_10m, // wind_direction_10m
                uv_index: current.uv_index, // uv_index
                visibility: current.visibility, // visibility
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

  return (
    <View className="flex-1" style={{
        backgroundColor: weatherData.current?.is_day ? '#3B82F6' : '#1E3A8A',
    }}>
      <StatusBar style="light" />

      {/* MODAL DE LOADING */}
        <Modal visible={loading} transparent animationType="fade">
            <View className="flex-1 bg-black/70 justify-center items-center">
            <ActivityIndicator size="large" color="#fff" />
            <Text className="text-white text-xl mt-4">Obtendo informações do clima...</Text>
            <Text className="text-gray-300 mt-2">Por favor, aguarde alguns segundos</Text>
            </View>
        </Modal>
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex flex-row justify-between items-center px-6 pt-12 pb-8">
          <View>
            <Text className="text-white text-sm font-medium opacity-80">Hoje</Text>
            <Text className="text-white text-2xl font-semibold">
              {locationName}
            </Text>
          </View>
          <TouchableOpacity 
            className="bg-white/20 p-3 rounded-full"
            activeOpacity={0.7}
            onPress={async () => handleRefresh()}
          >
            <FontAwesome name={loading ? "refresh" : "map-marker"} size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* No location */}
        {!weatherData.current && (
        <>
          {/* Main Weather Section - Centered */}
          <View className="flex-1 justify-center items-center px-6">

            {/* Weather App Title */}
            <View className="flex flex-col items-center mb-8">
                <FontAwesome 
                    name="cloud" 
                    size={64} 
                    color={"#E5E7EB"} 
                />
                <Text className="text-white text-[12vw] font-semibold mb-8">
                Weather App
                </Text>
                {/* Weather Icon */}
                <View className="rounded-full">
                </View>
                <Text className="text-white text-xl font-normal mb-8">
                    Monitoramento de Clima em tempo real
                </Text>
            </View>

            {/* Location Request Card */}
            <View className="w-full max-w-2xl">
                <View className="bg-white/10 rounded-2xl p-6 mt-8 border border-white/20">
                <View className="flex flex-row justify-between items-center mb-6">
                    <View className="items-center flex-1">
                        <Text className="text-white text-md font-semibold uppercase tracking-wider">
                            Buscar dados Meteorologicos
                        </Text>
                        <TouchableOpacity 
                            className="flex flex-row gap-2 mt-4 bg-white/20 p-4 rounded-full"
                            activeOpacity={0.7}
                            onPress={async () => handleAllowLocation()}
                        >
                            {/* Insert location icon */}
                            <FontAwesome name="map-marker" size={18} color="white" />
                            <Text className="text-white font-semibold">
                                Permitir Localização
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                </View>
            </View>
          </View>

          {/* Instructions Card */}
            <View className="w-full max-w-2xl p-5">
                <View className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <View className="flex flex-row justify-between items-center mb-6">
                    <View className="items-center flex-1">
                        <Text className="text-white text-md font-semibold uppercase tracking-wider">
                            Aviso
                        </Text>
                        <View className="w-full mt-4 bg-white/20 p-4 rounded-xl">
                            <Text className="text-white text-center text-sm font-normal">
                                Não armazenamos nenhum dado de localização. Esse aplicativo tem fins meramente acadêmicos.
                            </Text>
                        </View>

                    </View>
                </View>
                </View>
            </View>
        </>
        )}

        {/* Has location */}
        {weatherData.current && (
        <>
            {/* Main Weather Section - Centered */}
            <View className="flex-1 justify-center items-center px-6">
            {/* Weather Icon */}
            <View className="items-center mb-8">
                <View className="rounded-full p-8 mb-6">
                <FontAwesome 
                    name={weatherData.current?.is_day ? "sun-o" : "moon-o"} 
                    size={120} 
                    // create sun rays effect
                    className='rounded-full shadow-[100_100_100px_rgba(255,255,255,1)] '
                    backgroundColor={weatherData.current?.is_day ? "#FCD34D15" : "#AAAAFF09"} 
                    color={weatherData.current?.is_day ? "#FCD34D" : "#E5E7EB"} 
                />
                </View>
                
                {/* Temperature */}
                <Text className="text-white text-8xl font-thin mb-2">
                {weatherData.current?.temperature_2m ? Math.round(weatherData.current.temperature_2m) : '--'}°
                </Text>
                
                {/* Weather Condition */}
                <Text className="text-white text-xl font-light mb-1">
                {weatherData.current?.is_day ? 'Ensolarado' : 'Noite Clara'}
                </Text>
                
                {/* Feels Like */}
                <Text className="text-white text-base">
                Sensação térmica {weatherData.current?.apparent_temperature ? Math.round(weatherData.current.apparent_temperature) : '--'}°
                </Text>
            </View>

            {/* Weather Details Cards */}
            <View className="w-full max-w-2xl">
                <View className="flex flex-col justify-center items-center bg-white/10 rounded-2xl p-6 mt-8 border border-white/20">
                <View className="flex flex-row justify-between items-center mb-6">
                    <View className="items-center flex-1">
                    <View className="bg-white/20 p-3 rounded-full mb-3">
                        <FontAwesome name="eye" size={20} color="white" />
                    </View>
                    <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                        Visibilidade
                    </Text>
                    <Text className="text-white text-lg font-semibold">
                        {weatherData.current?.visibility ? `${(weatherData.current.visibility / 1000).toFixed(1)} km` : '--'}
                    </Text>
                    </View>

                    <View className="w-px h-12 bg-white/20 mx-4" />

                    <View className="items-center flex-1">
                    <View className="bg-white/20 p-3 rounded-full mb-3">
                        <FontAwesome name="tint" size={20} color="white" />
                    </View>
                    <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                        Chuva
                    </Text>
                    <Text className="text-white text-lg font-semibold">
                        {weatherData.current?.rain ? `${weatherData.current.rain} mm` : '0 mm'}
                    </Text>
                    </View>

                    <View className="w-px h-12 bg-white/20 mx-4" />

                    <View className="items-center flex-1">
                    <View className="bg-white/20 p-3 rounded-full mb-3">
                        <FontAwesome name="location-arrow" size={20} color="white" />
                    </View>
                    <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                        Vento
                    </Text>
                    <Text className="text-white text-lg font-semibold">
                        {weatherData.current?.wind_speed_10m ? `${Math.round(weatherData.current.wind_speed_10m)} km/h` : '0 km/h'}
                    </Text>
                    </View>
                    
                </View>
                <TouchableOpacity 
                        className="flex flex-row w-fit justify-center gap-2 mt-4 bg-white/20 p-4 px-8 rounded-full"
                        activeOpacity={0.7}
                        onPress={async () => handleRefresh()}
                    >
                    {/* Insert location icon */}
                    <FontAwesome name="refresh" size={18} color="white" />
                    <Text className="text-white font-semibold">
                        Recarregar Dados
                    </Text>
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </>
        )}
      </ScrollView>
    </View>
  );
}