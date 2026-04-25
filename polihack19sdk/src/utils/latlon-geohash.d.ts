declare module 'latlon-geohash' {
  function encode(
    latitude: number,
    longitude: number,
    precision?: number
  ): string;
  function decode(geohash: string): [number, number];
  export { encode, decode };
}
