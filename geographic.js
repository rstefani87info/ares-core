import NodeGeocoder from 'node-geocoder';
export const defaultGeocoderOptions = {
    provider: 'openstreetmap'
};
  
export function getGeocoder(options = defaultGeocoderOptions) {
    return NodeGeocoder(options);
}