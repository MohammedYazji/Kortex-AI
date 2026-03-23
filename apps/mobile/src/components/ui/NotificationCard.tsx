import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
// TODO: Import your Category type and the CategoryBadge component you just built!

interface NotificationCardProps {
  id: number;
  appName: string;
  // TODO: Add the rest of the missing props (title, body, category, createdAt)
  // TODO: Add an optional 'onDismiss' function prop that takes an ID and returns nothing.
}

export function NotificationCard({
  id,
  appName,
  // TODO: Destructure the rest of your props here!
}: NotificationCardProps) {
  return (
    // TODO: This is the main outer card container
    <View style={styles.card}>
      {/* TODO: Create a View on the left side to hold an icon (e.g. the first letter of the appName) */}
      <View style={styles.iconBox}>{/* Add Text here */}</View>

      {/* TODO: Create a View on the right side to hold ALL the text content */}
      <View style={styles.content}>
        {/* TODO: Add a row for the appName and the time. */}

        {/* TODO: Conditionally render the 'title' Text ONLY if a title exists */}

        {/* TODO: Render the 'body' text. */}

        {/* TODO: Add your custom <CategoryBadge /> component here, passing it the 'category' prop */}

        {/* TODO: Conditionally render a 'Dismiss' TouchableOpacity ONLY if the onDismiss function prop was provided */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // TODO: Arrange the icon box and the text content side-by-side (flexDirection: 'row')
    // TODO: Add padding, margins, borders, and a nice dark background color!
  },
  iconBox: {
    // TODO: Make this a circle!
  },
  content: {
    // TODO: Make this take up all the remaining space on the right (flex: 1)
  },
  // TODO: Add the rest of your precise text sizes, weights, and colors here!
});
