import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Fingerprint, ShieldCheck, KeyRound, Undo2, Delete } from "lucide-react-native";
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  onUnlock: () => void;
  onLogout: () => void;
};

const PIN_KEY = "security_pin";
const { width } = Dimensions.get('window');

export function SecurityScreen({ onUnlock, onLogout }: Props) {
  const [pin, setPin] = useState("");
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasStoredPin, setHasStoredPin] = useState(false);

  useEffect(() => {
    checkBiometrics();
    checkStoredPin();
  }, []);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsBiometricSupported(compatible);
    if (compatible) {
       handleBiometricAuth();
    }
  };

  const checkStoredPin = async () => {
    const stored = await AsyncStorage.getItem(PIN_KEY);
    setHasStoredPin(!!stored);
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock IUU Mission Control',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) {
        onUnlock();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      Alert.alert("Invalid PIN", "PIN must be at least 4 digits");
      return;
    }

    const stored = await AsyncStorage.getItem(PIN_KEY);
    
    if (!stored) {
      await AsyncStorage.setItem(PIN_KEY, pin);
      onUnlock();
    } else {
      if (pin === stored) {
        onUnlock();
      } else {
        Alert.alert("Access Denied", "Incorrect Security PIN");
        setPin("");
      }
    }
  };

  const handleNumPress = (num: string) => {
    if (pin.length < 6) setPin(prev => prev + num);
  };

  const handleDel = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const pinDots = Array(6).fill(0).map((_, i) => i < pin.length);
  const NumpadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['bio', '0', 'del']
  ];

  return (
    <LinearGradient colors={['#020617', '#082f49', '#020617']} style={styles.container}>
      <View style={styles.content}>
        
        {/* Glowing Shield Header */}
        <View style={styles.headerState}>
          <View style={styles.iconCircleGlow}>
            <LinearGradient colors={['#0ea5e9', '#38bdf8']} style={styles.iconCircle}>
              <ShieldCheck color="#fff" size={42} strokeWidth={2} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Secure Lockdown</Text>
          <Text style={styles.subtitle}>
            {hasStoredPin ? "ENTER SERVICE PIN TO UNLOCK" : "INITIALIZE NEW SECURITY PIN"}
          </Text>
        </View>

        {/* PIN Indicators */}
        <View style={styles.pinContainer}>
          {pinDots.map((isFilled, i) => (
            <View key={i} style={[styles.pinDot, isFilled && styles.pinDotFilled]}>
               {isFilled && <View style={styles.pinDotCore} />}
            </View>
          ))}
        </View>

        {/* Action Button */}
        <Pressable 
          style={[styles.unlockBtn, pin.length >= 4 ? styles.unlockBtnActive : styles.unlockBtnDisabled]} 
          onPress={handlePinSubmit}
          disabled={pin.length < 4}
        >
          <KeyRound color={pin.length >= 4 ? "#fff" : "#94a3b8"} size={20} />
          <Text style={[styles.unlockText, pin.length >= 4 ? {color: '#fff'} : {color: '#94a3b8'}]}>
            {hasStoredPin ? "DECRYPT VAULT" : "SET PIN"}
          </Text>
        </Pressable>

        {/* Custom Glassmorphic Numpad */}
        <View style={styles.numpadContainer}>
          {NumpadRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.numpadRow}>
              {row.map(cell => {
                if (cell === 'bio') {
                  return (
                    <Pressable key="bio" style={styles.numpadKey} onPress={isBiometricSupported ? handleBiometricAuth : undefined}>
                      {isBiometricSupported && <Fingerprint color="#38bdf8" size={32} />}
                    </Pressable>
                  );
                }
                if (cell === 'del') {
                  return (
                    <Pressable key="del" style={styles.numpadKey} onPress={handleDel}>
                      <Delete color="#94a3b8" size={24} />
                    </Pressable>
                  );
                }
                return (
                  <Pressable key={cell} style={styles.numpadKey} onPress={() => handleNumPress(cell)}>
                    <Text style={styles.numpadKeyText}>{cell}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Footer Logout */}
        <Pressable style={styles.logoutBtn} onPress={onLogout}>
          <Undo2 color="#64748b" size={14} />
          <Text style={styles.logoutText}>SWITCH OPERATOR</Text>
        </Pressable>

      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingTop: 80, paddingBottom: 40 },
  headerState: { alignItems: "center", gap: 16 },
  
  iconCircleGlow: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(56, 189, 248, 0.1)', alignItems: "center", justifyContent: "center", shadowColor: "#38bdf8", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center" },
  
  title: { fontSize: 32, fontWeight: "900", color: "#f8fafc", letterSpacing: -1, textShadowColor: 'rgba(56, 189, 248, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  subtitle: { fontSize: 11, fontWeight: "900", color: "#38bdf8", letterSpacing: 2, opacity: 0.8 },
  
  pinContainer: { flexDirection: "row", gap: 16, marginVertical: 20 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(56, 189, 248, 0.3)', alignItems: "center", justifyContent: "center" },
  pinDotFilled: { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.2)' },
  pinDotCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8' },
  
  unlockBtn: { width: width * 0.8, height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  unlockBtnActive: { backgroundColor: '#0ea5e9', shadowColor: "#0ea5e9", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  unlockBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  unlockText: { fontWeight: "900", fontSize: 14, letterSpacing: 1.5 },
  
  numpadContainer: { width: width * 0.85, gap: 16, marginBottom: 20 },
  numpadRow: { flexDirection: "row", justifyContent: "space-between" },
  numpadKey: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  numpadKeyText: { fontSize: 30, color: "#f8fafc", fontWeight: "300" },
  
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 8, opacity: 0.6, padding: 10 },
  logoutText: { color: "#94a3b8", fontWeight: "800", fontSize: 11, letterSpacing: 1.5 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 6, 23, 0.9)', alignItems: "center", justifyContent: "center" }
});
