import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
// SDK 58: os tipos do react-native-webview 14 nao encaixam no React 19.3 (props: never).
// Tipo solto so aqui; o resto do ficheiro continua verificado.
const WebView = RNWebView as unknown as import('react').ComponentType<any>;
import { Coordinates } from '../../types';
import { DRIVER_MAP_HTML } from './driverMapHtml';

export type DemandIntensity = 'high' | 'medium' | 'normal';

export interface DemandZone {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  intensity: DemandIntensity;
}

export interface MapMarker {
  latitude: number;
  longitude: number;
  kind: 'me' | 'passenger' | 'destination';
}

interface DriverMapViewProps {
  center: Coordinates;
  zoom?: number;
  zones?: DemandZone[];
  /** Quando definido, o mapa mostra estes marcadores e ajusta o zoom, em vez de centrar num ponto unico. */
  markers?: MapMarker[];
  /** Muda para forcar um novo ajuste de zoom aos marcadores. */
  fitKey?: string;
}

const SOURCE = { html: DRIVER_MAP_HTML };

export default function DriverMapView({ center, zoom = 15, zones, markers, fitKey }: DriverMapViewProps) {
  const markersKey = JSON.stringify(markers ?? null);
  const webRef = useRef<RNWebView>(null);
  const readyRef = useRef(false);

  const pushState = () => {
    if (markers) {
      webRef.current?.injectJavaScript(`window.setMarkers(${JSON.stringify(markers)}, ${JSON.stringify(fitKey ?? '')}); true;`);
    } else {
      webRef.current?.injectJavaScript(`window.setCenter(${center.latitude}, ${center.longitude}, ${zoom}); true;`);
    }
    if (zones) {
      webRef.current?.injectJavaScript(`window.setZones(${JSON.stringify(zones)}); true;`);
    }
  };

  useEffect(() => {
    if (readyRef.current) pushState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.latitude, center.longitude, zoom, zones, markersKey, fitKey]);

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
