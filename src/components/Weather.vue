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
  // 1. 定义获取经纬度的函数（会弹窗询问用户）
  const getGPSLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("浏览器不支持 GPS 定位");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${longitude},${latitude}`); // 格式：经度,纬度
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        }
      );
    });
  };

  try {
    let locationParam = 'auto'; // 默认为 auto
    let cityName = '未知地区';

    // 2. 尝试用 GPS 获取经纬度
    try {
      const coordStr = await getGPSLocation();
      console.log('GPS 定位成功，经纬度:', coordStr);
      locationParam = coordStr;
    } catch (gpsError) {
      console.warn('GPS 定位失败，将回退到 IP 定位:', gpsError.message);
      // 如果用户拒绝或失败，继续保持 locationParam = 'auto'
    }

    // 3. 用 locationParam (经纬度 或 auto) 反查城市
    const locationRes = await getAdcode(mainKey, locationParam);
    if (locationRes.code !== '200') {
      throw `地理反查失败: ${locationRes.code}`;
    }

    // 4. 提取城市信息
    const location = locationRes.location[0];
    cityName = location.name;
    const cityId = location.id;

    weatherData.adCode = {
      city: cityName,
      adcode: cityId,
    };

    // 5. 获取天气数据
    const weatherRes = await getWeather(mainKey, cityId);
    if (weatherRes.code !== '200') {
      throw `天气查询失败: ${weatherRes.code}`;
    }

    const now = weatherRes.now;
    weatherData.weather = {
      weather: now.text,
      temperature: now.temp,
      winddirection: now.windDir,
      windpower: now.windScale + '级',
    };

  } catch (error) {
    console.error('获取天气信息失败:', error);
    onError('天气信息获取失败');
  }
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
