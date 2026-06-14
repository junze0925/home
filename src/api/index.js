// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  const res = await fetch(
    `${import.meta.env.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
  );
  const data = await res.json();

  if (data[0].url.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: domain + jsonpData.req_0.data.midurlinfo[i].purl,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 天气
 */

// 获取高德地理位置信息
// 高德 IP 定位（JSONP 版本，无跨域问题）
export const getAdcode = (key) => {
  return new Promise((resolve) => {
    window._amap_callback = (data) => {
      delete window._amap_callback;
      resolve(data);
    };
    const script = document.createElement('script');
    script.src = `https://restapi.amap.com/v3/ip?key=${key}&callback=_amap_callback`;
    document.body.appendChild(script);
  });
};

// 和风天气（保持不变）
export const getWeather = async (key, location) => {
  const res = await fetch(`https://k56r72f3db.re.qweatherapi.com/v7/weather/now?location=${location}&key=${key}`);
  return await res.json();
};
// 使用 adcode 查询和风天气标准 ID
export const getCityIdByAdcode = async (key, adcode) => {
  const res = await fetch(
    `https://k56r72f3db.re.qweatherapi.com/geo/v2/city/lookup?location=${adcode}&key=${key}`
  );
  return await res.json();
};

// 获取在线天气 API
// https://api.oioweb.cn/doc/weather/GetWeather
export const getOtherWeather = async () => {
  const res = await fetch("https://uapis.cn/api/v1/misc/weather");
  return await res.json();
};
