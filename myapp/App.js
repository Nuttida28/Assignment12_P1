import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from "react-native-chart-kit";
import init from 'react_native_mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- ตั้งค่า MQTT ---
init({
  size: 10000,
  storageBackend: AsyncStorage,
  defaultExpiration: 1000 * 3600 * 24,
  enableCache: true,
  reconnect: true,
  sync: {}
});

const MQTT_HOST = 'broker.emqx.io';
const MQTT_PORT = 8084;
const PATH = '/mqtt';
const TOPIC = 'assignment12'; 

const screenWidth = Dimensions.get("window").width;

export default function App() {
  const [tempData, setTempData] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [currentTemp, setCurrentTemp] = useState(0);
  const [status, setStatus] = useState('กำลังเชื่อมต่อ...');

  useEffect(() => {
    const clientId = 'MobileClient-' + Math.random().toString(16).substr(2, 8);
    const mqttClient = new Paho.MQTT.Client(MQTT_HOST, MQTT_PORT, PATH, clientId);

    mqttClient.onMessageArrived = (message) => {
      try {
        const payload = JSON.parse(message.payloadString);
        
        if (payload.temp) {
          const newTemp = parseFloat(payload.temp);
          setCurrentTemp(newTemp);
          
          setTempData((prevData) => {
            const newData = [...prevData, newTemp];
            return newData.slice(-10);
          });
        }
      } catch (e) {
        console.log("Error parsing message", e);
      }
    };

    mqttClient.onConnectionLost = () => setStatus('เชื่อมต่อหลุด!');

    mqttClient.connect({
      onSuccess: () => {
        setStatus('Online');
        mqttClient.subscribe(TOPIC);
      },
      onFailure: () => setStatus('เชื่อมต่อไม่สำเร็จ'),
      useSSL: true,
    });

    return () => { if (mqttClient.isConnected()) mqttClient.disconnect(); };
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 กราฟอุณหภูมิ Real-time</Text>
          <Text style={[styles.statusText, { color: status === 'Online' ? '#4CAF50' : '#F44336' }]}>
            ● {status}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.tempText}>อุณหภูมิปัจจุบัน: {currentTemp} °C</Text>

          {/* วาดกราฟ */}
          <LineChart
            data={{
              labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
              datasets: [{ data: tempData }]
            }}
            width={screenWidth - 40}
            height={250}
            yAxisSuffix="°C"
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(255, 69, 58, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "5", strokeWidth: "2", stroke: "#FF453A" }
            }}
            bezier
            style={styles.chart}
          />
          <Text style={styles.noteText}>*แสดงผล 10 ค่าล่าสุด</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { padding: 15, backgroundColor: '#FFF', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E4E6EB' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1E21' },
  statusText: { fontSize: 12, marginTop: 2, fontWeight: 'bold' },
  content: { flex: 1, padding: 20, alignItems: 'center' },
  tempText: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  chart: { borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  noteText: { marginTop: 10, fontSize: 12, color: '#666' }
});