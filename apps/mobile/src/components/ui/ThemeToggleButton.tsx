import { useAppStore } from "../../store/appStore";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";

function ThemeToggleButton() {
    const { toggleTheme, themeOverride } = useAppStore();
    const isDark = themeOverride === "dark";


    return (
        <Pressable
            onPress={toggleTheme}
            style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                // backgroundColor: "#444",
                backgroundColor: isDark ? "#222" : "#00C2A8",
            }}
        >
            <Text style={{ color: isDark ? "#00C2A8" : "#ffff", fontWeight: "600" }}>
                {themeOverride === "dark" ? "Dark" : "Light"}
            </Text>
        </Pressable>
    );
}
export default ThemeToggleButton;