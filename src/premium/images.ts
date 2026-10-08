/** Bundled photography — premium mock imagery (Unsplash licence). */
export const IMG = {
  hotelNight: require("../../assets/premium/hotel-night.jpg"),
  hotelPool: require("../../assets/premium/hotel-pool.jpg"),
  hotelDusk: require("../../assets/premium/hotel-dusk.jpg"),
  resort: require("../../assets/premium/resort.jpg"),
  room: require("../../assets/premium/room.jpg"),
  cruise: require("../../assets/premium/cruise.jpg"),
  flight: require("../../assets/premium/flight.jpg"),
  themepark: require("../../assets/premium/themepark.jpg"),
  cinema: require("../../assets/premium/cinema.jpg"),
  concert: require("../../assets/premium/concert.jpg"),
  stadium: require("../../assets/premium/stadium.jpg"),
  mumbai: require("../../assets/premium/mumbai.jpg"),
  jaipur: require("../../assets/premium/jaipur.jpg"),
  kiosk: require("../../assets/premium/kiosk.jpg"),
  familyWalk: require("../../assets/premium/family-walk.jpg"),
  familyPlane: require("../../assets/premium/family-plane.jpg"),
  user: require("../../assets/premium/p-user.jpg"),
  wife: require("../../assets/premium/p-wife.jpg"),
  child: require("../../assets/premium/p-child.jpg"),
  father: require("../../assets/premium/p-father.jpg"),
  sister: require("../../assets/premium/p-sister.jpg"),
} as const;

export type ImgKey = keyof typeof IMG;
