import { View, Text, StyleSheet } from "react-native";

type Props = {
    title: string;
    subtitle: string;
    color: string;
};

export default function EmptyState({ title, subtitle, color }: Props) {
    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color }]}>{title}</Text>
            <Text style={[styles.subtitle, { color }]}>{subtitle}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
        opacity: 0.7,
    },
});