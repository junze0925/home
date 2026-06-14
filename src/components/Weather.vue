<template>
  <div class="weather" v-if="weatherData.adCode.city && weatherData.weather.weather">
    <span>{{ weatherData.adCode.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.weather.winddirection 
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.weather.windpower }}</span>
  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { getAdcode, getWeather, getOtherWeather } from "@/api";
import { Error } from "@icon-park/vue-next";

// 高德开发者 Key
const mainKey = import.meta.env.VITE_WEATHER_KEY;

// 天气数据
const weatherData = reactive({
  adCode: {
    city: null, // 城市
    adcode: null, // 城市编码
  },
  weather: {
    weather: null, // 天气现象
    temperature: null, // 实时气温
    winddirection: null, // 风向描述
    windpower: null, // 风力级别
  },
});

// 取出天气平均值
const getTemperature = (min, max) => {
  try {
    // 计算平均值并四舍五入
    const average = (Number(min) + Number(max)) / 2;
    return Math.round(average);
  } catch (error) {
    console.error("计算温度出现错误：", error);
    return "NaN";
  }
};

// 获取天气数据
const getWeatherData = async () => {
  try {
    // 获取地理位置信息
    if (!mainKey) {
      console.log("未配置，使用备用天气接口");
      const result = await getOtherWeather();
      console.log(result);
      const data = result.result;
      weatherData.adCode = {
        city: data.city.City || "未知地区",
        // adcode: data.city.cityId,
      };
      weatherData.weather = {
        weather: data.condition.day_weather,
        temperature: getTemperature(data.condition.min_degree, data.condition.max_degree),
        winddirection: data.condition.day_wind_direction,
        windpower: data.condition.day_wind_power,
      };
    } else {
      // 获取 Adcode
      const locationRes = await getAdcode(mainKey);
      console.log(locationRes);
      if (locationRes.code !== "200") {
        throw "地区查询失败";
      }
      const location = locationRes.location[0];
     weatherData.adCode = {
       city: location.name,  // 城市名称（如 "金华市"）
       adcode: location.id,  // 城市 ID（如 "101260901"）
     };

      // 获取天气信息
      const weatherRes = await getWeather(mainKey, weatherData.adCode.adcode);
      if (weatherRes.code !== "200")
       throw "天气查询失败";
      const now = weatherRes.now;
      weatherData.weather = {
        weather: now.text,          // 天气现象（如 "晴"）
        temperature: now.temp,      // 气温（如 "20"）
         winddirection: now.windDir, // 风向（自带 "风" 字）
         windpower: now.windScale + "级", // 风力（数字 + "级"）
      };
    }
  } catch (error) {
    console.error("天气信息获取失败:" + error);
    onError("天气信息获取失败");
  }
};

// 报错信息
const onError = (message) => {
  ElMessage({
    message,
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  console.error(message);
};

onMounted(() => {
  // 调用获取天气
  getWeatherData();
});
</script>
