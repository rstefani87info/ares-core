import axios from "axios";

export function getGeocoder(aReS, language) {
  aReS.geocoder= aReS.geocoder ?? {};
  aReS.geocoder[language] = aReS.geocoder[language] ?? new Geocoder(aReS,language);
  
}

class Geocoder{
  constructor(aReS,language){
    this.config = aReS.appSetup.enabledGeoCoders;
    this.language = language;
  } 

  async encode(address) {
    return await this.doTillDone(async (geocoder, apikey) => {
        return await this.getCoordinates(geocoder,address, apikey);
      });
  }

  async decode({latatitude, longitude}) {
      return await this.doTillDone(async (geocoder, apikey) => {
        return await this.getAddress(geocoder,{latatitude, longitude}, apikey);
      });
  }

  async doTillDone(doAction) {
    for(const {name,apikey} of this.config){
      try{
        const geocoder = Geocoders[name];
      if(geocoder){
        return await doAction(geocoder,apikey);
      }}catch(e){
        console.warn(`Geocoder ["${name}"] error:`,e);
      }
    }
  }

  async doForAll(doAction) {
    let result =null;
    for(const config of this.config){
      try{
        const geocoder = Geocoders[config.name];
        geocoder.config = config;
      if(geocoder){
        const partial = await doAction(geocoder,config.apikey);
        if(partial){
          if(!result){
            result = partial;
          }else{
            result = result.concat(partial);
          }
        }
      }}catch(e){
        console.warn(`Geocoder ["${name}"] error:`,e);
      }
    }
  }

  async getInfo({url, options}) {
    try {
      const response = await axios(url, options);
      const data = response.data;
      if (data && data.length > 0) {
        return data;
      }
      throw new Error("Address not found.");
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP error: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error("No response received from server.");
      } else {
        throw new Error(`Error in setting up request: ${error.message}`);
      }
    }
  }

  async canCallGeocoder(config){
      return config.hasOwnProperty("canCall") && (config.canCall === true || (await config.canCall(config.config)));
  }

  async getAddress(config,{latitude, longitude}, apikey){ 
    const url = config.addressInfoURL.replace('{latitude}', latitude).replace('{longitude}', longitude).replace('{apikey}', apikey).replace('{language}', this.language);
    const data = await this.getInfo(url);
    return data.map(info => config.canonize(info));
  }

  async getCoordinates(config, address, apikey){
    const url = config.coordinatesInfoURL.replace('{address}', address).replace('{apikey}', apikey).replace('{language}', this.language);
    const data = await this.getInfo(url, config);
    return data.map(info => config.canonize(info));
  }
}

export function getCenterCoordinates(...coordinates) {
  const lats = coordinates.map(c => c.latitude);
  const lngs = coordinates.map(c => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  return {latitude: centerLat, longitude: centerLng};
}

export function getDistanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000;
}

export const Geocoders = {

  OpenStreetMap: {
    addressInfoURL:  `https://nominatim.openstreetmap.org/search?q={address}&format=json&accept-language={lang}`,
    coordinatesInfoURL:  `https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json&accept-language={language}`,

    canonize: async (data) => {
        const newData = { ...data, latitude: data.lat, longitude: data.lon };
        delete newData.lat;
        delete newData.lon;
        if (newData.display_name) {
          newData.address = newData.display_name;
          delete newData.display_name;
        }
        return newData;
      },
    },
  
    GoogleMaps: {
      getAddressInfo:  `https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={apiKey}`,
      getCoordinatesInfo:  `https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key={apiKey}`,

      canCall: async (config) => {
        const url = `https://billing.googleapis.com/v1/billingAccounts/${config.billingAccountID}/credits?key=${configapiKey}`;
        try {
          const response = await axios.get(url, {
            headers: { },
          });
          console.log('Crediti disponibili:', response.data);
          return response.data;
        } catch (error) {
          console.error('Errore durante il recupero dei crediti:', error);
          throw error;
        }
      },
      
      canonize: async (data) => {
        if(data.status && data.status === 'OVER_QUERY_LIMIT'){
          throw new Error(`GoogleMaps OVER_QUERY_LIMIT: ${data.error_message}`);
        }
        if(data.satus==='OK'){
          const newData = { ...data, latitude: data.geometry.location.lat, longitude: data.geometry.location.lng };
          delete newData.geometry.location.lat;
          delete newData.geometry.location.lng;
          if (newData.formatted_address) {
            newData.address = newData.formatted_address;
            delete newData.formatted_address;
          }
          return newData;
        }
      },

    },
  
  };
  

  
