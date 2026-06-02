import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";
import { registerRootComponent } from 'expo';
import { RootNavigator } from "./src/navigation/RootNavigator";
import { Buffer } from "buffer";
(global as any).Buffer = (global as any).Buffer || Buffer;


function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
        <StatusBar style="dark" />
        <RootNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fafc"
  }
});

registerRootComponent(App);

export default App;
