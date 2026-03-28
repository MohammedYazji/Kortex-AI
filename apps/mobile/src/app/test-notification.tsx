import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    useColorScheme,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

import { processNotification } from "../services/notificationService";
import { useAppStore } from "../store/appStore";
import Colors from "../constants/Colors";
import { Feather } from "@expo/vector-icons";
export const unstable_settings = {
    presentation: "modal",
};

export default function TestNotification() {
    const router = useRouter();
    const [appName, setAppName] = useState("");
    const [sender, setSender] = useState("");
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const { rules, focusMode, themeOverride } = useAppStore();
    const systemTheme = useColorScheme();

    const theme =
        themeOverride === "dark"
            ? Colors.dark
            : themeOverride === "light"
                ? Colors.light
                : systemTheme === "dark"
                    ? Colors.dark
                    : Colors.light;

    const handleSubmit = async () => {
        if (!appName || !body) return;

        const result = await processNotification(
            appName,
            title,
            body,
            rules,
            focusMode
        );

        alert(
            `Category: ${result.category}\nConfidence: ${(
                result.confidence * 100
            ).toFixed(1)}%`
        );
    };

    const presets = [
        {
            label: "Family Message",
            data: {
                app: "WhatsApp",
                sender: "Mom",
                title: "Call me",
                body: "Please call me ASAP",
            },
        },
        {
            label: "Promo Email",
            data: {
                app: "Gmail",
                sender: "Store",
                title: "50% OFF!",
                body: "Limited time discount offer",
            },
        },
        {
            label: "Instagram Like",
            data: {
                app: "Instagram",
                sender: "User123",
                title: "New Like",
                body: "Someone liked your photo",
            },
        },
    ];
    const isDisabled = !appName || !title || !body;


    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ padding: 16 }}
        >
            {/* iOS handle */}
            <View style={[styles.handle, { backgroundColor: theme.textSecondary }]} />

            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={[styles.title, { color: theme.text }]}>
                    Test Notification
                </Text>

                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [
                        {
                            width: 50,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: theme.surfaceElevated,
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: pressed ? 0.7 : 1,
                            marginBottom:5
                        },
                    ]}
                >
                    <Text style={{ color: theme.tint, fontWeight: "700" }}>close</Text>
                </Pressable>
            </View>

            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Simulate a notification and see how AI classifies it
            </Text>

            {/* Presets */}
            <Text style={[styles.section, { color: theme.textSecondary }]}>
                QUICK PRESETS
            </Text>

            <View style={styles.row}>
                {presets.map((p) => (
                    <Pressable
                        key={p.label}
                        style={({ pressed }) => [
                            styles.pill,
                            {
                                backgroundColor: theme.surfaceElevated,
                                opacity: pressed ? 0.7 : 1,
                            },
                        ]}
                        onPress={() => {
                            setAppName(p.data.app);
                            setSender(p.data.sender);
                            setTitle(p.data.title);
                            setBody(p.data.body);
                        }}
                    >
                        <Text style={{ color: theme.text }}>{p.label}</Text>
                    </Pressable>
                ))}
            </View>

            {/* Form */}
            <Text style={[styles.section, { color: theme.textSecondary }]}>
                CUSTOM NOTIFICATION
            </Text>

            <Text style={[styles.label, { color: theme.text }]}>App Name *</Text>
            <TextInput
                placeholder="e.g. WhatsApp, Gmail"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated }]}
                value={appName}
                onChangeText={setAppName}
            />

            <Text style={[styles.label, { color: theme.text }]}>Sender (optional)</Text>
            <TextInput
                placeholder="e.g. Mom, Team Lead"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated }]}
                value={sender}
                onChangeText={setSender}
            />

            <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
            <TextInput
                placeholder="Notification title"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated }]}
                value={title}
                onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: theme.text }]}>Body *</Text>
            <TextInput
                placeholder="Notification body text..."
                placeholderTextColor={theme.textSecondary}
                style={[
                    styles.input,
                    styles.textArea,
                    { color: theme.text, backgroundColor: theme.surfaceElevated },
                ]}
                multiline
                value={body}
                onChangeText={setBody}
            />

            {/* Button */}
            <Pressable
                onPress={handleSubmit}
                disabled={isDisabled}
                style={({ pressed }) => [
                    {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 16,
                        paddingHorizontal: 20,
                        borderRadius: 20,
                        backgroundColor: isDisabled ? "#94a3b8" : theme.tint, 
                        opacity: pressed && !isDisabled ? 0.8 : 1,
                        transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 5,
                        marginTop: 20,
                    },
                ]}
            >
                <Feather
                    name="send"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                />
                <Text style={{ color: isDisabled ? "#ddd" : "#fff", fontWeight: "700", fontSize: 16 }}>
                    Classify & Add
                </Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    handle: {
        width: 40,
        height: 5,
        borderRadius: 10,
        alignSelf: "center",
        marginBottom: 10,
    },

    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    title: { fontSize: 24, fontWeight: "700" },

    subtitle: { marginBottom: 20 },

    section: {
        fontSize: 12,
        marginBottom: 10,
        marginTop: 10,
        letterSpacing: 1,
    },

    row: {
        flexDirection: "row",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 20,
    },

    pill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "transparent",
    },

    label: {
        marginBottom: 6,
        marginTop: 8,
    },

    input: {
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },

    textArea: {
        height: 100,
        textAlignVertical: "top",
    },

    button: {
        marginTop: 20,
        padding: 16,
        borderRadius: 18,
        alignItems: "center",
    },

    buttonText: {
        fontWeight: "700",
        fontSize: 16,
    },
});