import * as Font from "expo-font";

export const loadFonts = async () => {
  await Font.loadAsync({
    Poppins_400Regular: require("./Poppins-Regular.ttf"),
    Poppins_500Medium: require("./Poppins-Medium.ttf"),
    Poppins_600SemiBold: require("./Poppins-SemiBold.ttf"),
    Poppins_700Bold: require("./Poppins-Bold.ttf"),
  });
};
