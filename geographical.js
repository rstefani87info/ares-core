// import NodeGeocoder from 'node-geocoder';

// // todo: get a react native compatible version of this module
// export const defaultGeocoderOptions = {
//     provider: 'openstreetmap',
//     formatter: 'geojson',
//     extra: {
//         'accept-language': 'en' 
//     }
// };
  
// export function getGeocoder(options = defaultGeocoderOptions) {
//     return NodeGeocoder(options);
// }

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


const Geocoders = {
    OpenCage: {
      encode: async (address, apiKey) => {
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].geometry;
        }
        throw new Error("Address not found.");
      },
      decode: async (lat, lng, apiKey) => {
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat},${lng}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].formatted;
        }
        throw new Error("Coordinates not found.");
      },
    },
  
    GoogleMaps: {
      encode: async (address, apiKey) => {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].geometry.location;
        }
        throw new Error("Address not found.");
      },
      decode: async (lat, lng, apiKey) => {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].formatted_address;
        }
        throw new Error("Coordinates not found.");
      },
    },
  
    LocationIQ: {
      encode: async (address, apiKey) => {
        const url = `https://us1.locationiq.com/v1/search.php?key=${apiKey}&q=${encodeURIComponent(address)}&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.length > 0) {
          return { lat: data[0].lat, lng: data[0].lon };
        }
        throw new Error("Address not found.");
      },
      decode: async (lat, lng, apiKey) => {
        const url = `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.address) {
          return data.display_name;
        }
        throw new Error("Coordinates not found.");
      },
    },
  
    Nominatim: {
      encode: async (address) => {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.length > 0) {
          return { lat: data[0].lat, lng: data[0].lon };
        }
        throw new Error("Address not found.");
      },
      decode: async (lat, lng) => {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.display_name) {
          return data.display_name;
        }
        throw new Error("Coordinates not found.");
      },
    },
  
    PositionStack: {
      encode: async (address, apiKey) => {
        const url = `http://api.positionstack.com/v1/forward?access_key=${apiKey}&query=${encodeURIComponent(address)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          return { lat: data.data[0].latitude, lng: data.data[0].longitude };
        }
        throw new Error("Address not found.");
      },
      decode: async (lat, lng, apiKey) => {
        const url = `http://api.positionstack.com/v1/reverse?access_key=${apiKey}&query=${lat},${lng}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].label;
        }
        throw new Error("Coordinates not found.");
      },
    },
  };
  

  