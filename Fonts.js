import { useFonts } from "expo-font";

const Fonts = () => {
  const [fontsLoaded, fontError] = useFonts({
    Galmuri: require("./assets/fonts/Galmuri14.ttf"),
    Galmuri11Bold: require("./assets/fonts/Galmuri11-Bold.ttf"),  // 삭제 예정
    NeoDunggeunmoPro: require("./assets/fonts/NeoDunggeunmoPro-Regular.ttf"),
    BoldDunggeunmo: require("./assets/fonts/BoldDunggeunmo.ttf"),
    CaprasimoRegular: require("./assets/fonts/Caprasimo-Regular.ttf")
  });

  return [fontsLoaded, fontError];
};

export default Fonts;
