<template>
  <div class="weather" v-if="weatherData.city">
    <span>{{ weatherData.city }}&nbsp;</span>
    <span>{{ weatherData.weather }}&nbsp;</span>
    <span>{{ weatherData.temp }}℃</span>
    <span class="sm-hidden">&nbsp;{{ weatherData.windDir }}&nbsp;</span>
    <span class="sm-hidden">{{ weatherData.windPower }}</span>
  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { getAdcode, getCityIdByAdcode, getWeather, getOtherWeather } from "@/api";
import { reactive, onMounted } from "vue";

const amapKey = import.meta.env.VITE_AMAP_KEY;
const weatherKey = import.meta.env.VITE_WEATHER_KEY;

const weatherData = reactive({
  city: null,
  weather: null,
  temp: null,
  windDir: null,
  windPower: null,
});

const getWeatherData = async () => {
  try {
    if (!weatherKey) {
      const res = await getOtherWeather();
      const data = res.result;
      weatherData.city = data.city.City || "未知";
      weatherData.weather = data.condition.day_weather;
      weatherData.temp = Math.round((+data.condition.min_degree + +data.condition.max_degree) / 2);
      weatherData.windDir = data.condition.day_wind_direction;
      weatherData.windPower = data.condition.day_wind_power;
      return;
    }

    const ipRes = await getAdcode(amapKey);
    if (ipRes.status !== '1') throw new Error("定位失败");

    const cityName = ipRes.city;
    const adcode = ipRes.adcode;

    // ✅ 核心修复：先用 adcode 查标准 ID
    const cityRes = await getCityIdByAdcode(weatherKey, adcode);
    if (cityRes.code !== '200' || cityRes.location.length === 0) {
      throw new Error("未找到对应的城市 ID");
    }
    const cityId = cityRes.location[0].id;

    // ✅ 用标准 ID 请求天气
    const weatherRes = await getWeather(weatherKey, cityId);
    if (weatherRes.code !== '200') throw new Error("天气查询失败");

    const now = weatherRes.now;
    weatherData.city = cityName;
    weatherData.weather = now.text;
    weatherData.temp = now.temp;
    weatherData.windDir = now.windDir;
    weatherData.windPower = now.windScale + "级";

  } catch (e) {
    console.error(e);
    weatherData.city = null;
  }
};

onMounted(getWeatherData);
</script>