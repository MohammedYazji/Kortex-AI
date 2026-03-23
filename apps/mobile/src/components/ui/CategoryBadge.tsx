import React from "react";
import { StyleSheet, Text, View } from "react-native";
// TODO: Import the Category type from your types file!

interface Props {
  // TODO: Add a 'category' prop here. It should accept "urgent", "normal", or "noise".
  // TODO: Add an optional 'size' prop ("sm" or "md").
}

export function CategoryBadge({ category, size = "sm" }: Props) {
  // TODO: 1. Determine which background color to use based on the 'category' prop.
  // TODO: 2. Determine which emoji to use ("🔴", "🟡", or "🔇").
  // TODO: 3. Determine the text label based on the category ("Urgent", "Normal", "Noise").

  return (
    // TODO: Create a View wrapper containing your 'badge' style
    <View style={styles.badge}>
      {/* TODO: Add a <Text> component here to display the calculated emoji */}

      {/* TODO: Add a conditional render here! 
          Only show the text label if the 'size' prop is NOT "sm" */}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    // TODO: Add your layout styles here!
  },
  // TODO: Add styles for different sizes (sm vs md padding) and text fonts!
});
