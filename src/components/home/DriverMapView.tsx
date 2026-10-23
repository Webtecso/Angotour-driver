import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Coordinates } from '../../types';
import { DRIVER_MAP_HTML } from './driverMapHtml';

export type DemandIntensity = 'high' | 'medium' | 'normal';

export interface DemandZone {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  intensity: DemandIntensity;
}

interface DriverMapViewProps {
  center: Coordinates;
  zoom?: number;
  zones?: DemandZone[];
}

const SOURCE = { html: DRIVER_MAP_HTML };

export default function DriverMapView({ center, zoom = 15, zones }: DriverMapViewProps) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  const pushState = () => {
    webRef.current?.injectJavaScript(`window.setCenter(${center.latitude}, ${center.longitude}, ${zoom}); true;`);
    if (zones) {
      webRef.current?.injectJavaScript(`window.setZones(${JSON.stringify(zones)}); true;`);
    }
  };

  useEffect(() => {
    if (readyRef.current) pushState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.latitude, center.longitude, zoom, zones]);

  const handleMessage = () => {
    readyRef.current = true;
    pushState();
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={SOURCE}
        originWhitelist={['*']}
        style={StyleSheet.absoluteFill}
        onLoadEnd={handleMessage}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});
