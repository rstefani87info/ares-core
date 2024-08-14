import NodeGeocoder from 'node-geocoder';
export const defaultGeocoderOptions = {
    provider: 'openstreetmap',
    formatter: 'geojson',
    extra: {
        'accept-language': 'en' 
    }
};
  
export function getGeocoder(options = defaultGeocoderOptions) {
    return NodeGeocoder(options);
}