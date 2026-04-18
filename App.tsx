import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ForageMapScreen } from "./src/features/forage/ForageMapScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <ForageMapScreen />
    </SafeAreaProvider>
  );
}

