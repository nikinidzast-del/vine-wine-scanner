import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import { api, QuotaExceededError } from '../services/api';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.72;

export function ScannerScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [quota, setQuota] = useState<{ remaining: number; resetsAt: string | null } | null>(null);

  useEffect(() => {
    loadQuota();
  }, []);

  const loadQuota = async () => {
    try {
      const data = await api.user.getQuota();
      setQuota(data);
    } catch (e) { console.warn('Failed to load quota', e); }
  };

  const handleScan = async (imageUri: string) => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      const result = await api.scan.upload(imageUri, i18n.language);
      loadQuota();
      navigation.navigate('ScanResult', { scanId: result.scan.id });
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        navigation.navigate('Paywall', { reason: 'quota_exceeded' });
      } else {
        const message = error instanceof Error ? error.message : String(error);
        Alert.alert(t('common.error'), message);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      if (photo?.uri) handleScan(photo.uri);
    } catch {
      Alert.alert(t('common.error'), t('scanner.error_no_image'));
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      handleScan(result.assets[0].uri);
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <View style={styles.seal}>
            <Text style={styles.sealText}>V</Text>
          </View>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionText}>We need camera access to scan wine labels</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>VINO</Text>
        <View style={styles.topBarLine} />
      </View>

      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
        </View>
      </CameraView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
          <View style={styles.galleryIcon}>
            <View style={styles.galleryIconBar} />
            <View style={styles.galleryIconCircle} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isScanning && styles.capturing]}
          onPress={takePhoto}
          disabled={isScanning}
        >
          <View style={styles.captureOuter}>
            <View style={styles.captureInner} />
          </View>
        </TouchableOpacity>

        <View style={styles.galleryPlaceholder} />
      </View>

      {isScanning && (
        <View style={styles.scanningOverlay}>
          <View style={styles.scanningLine} />
          <Text style={styles.scanningText}>{t('scanner.scanning')}</Text>
        </View>
      )}

      {quota && (
        <View style={styles.quotaBadge}>
          <Text style={styles.quotaText}>{t('scanner.quota_remaining', { count: quota.remaining })}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0808',
  },
  topBar: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  topBarTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    letterSpacing: 8,
    opacity: 0.5,
  },
  topBarLine: {
    width: 20,
    height: 0.5,
    backgroundColor: colors.gold,
    opacity: 0.2,
    marginTop: spacing.xs,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 28,
    height: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: colors.gold,
    opacity: 0.7,
    borderTopLeftRadius: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: colors.gold,
    opacity: 0.7,
    borderTopRightRadius: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 28,
    height: 28,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: colors.gold,
    opacity: 0.7,
    borderBottomLeftRadius: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: colors.gold,
    opacity: 0.7,
    borderBottomRightRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    backgroundColor: '#0A0808',
    gap: spacing.xl,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIcon: {
    width: 20,
    height: 18,
    position: 'relative',
    opacity: 0.6,
  },
  galleryIconBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.text,
    borderRadius: 1,
  },
  galleryIconCircle: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -7,
    width: 14,
    height: 10,
    borderWidth: 1.5,
    borderColor: colors.text,
    borderRadius: 2,
  },
  galleryPlaceholder: {
    width: 48,
    height: 48,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 168, 76, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
  },
  capturing: {
    opacity: 0.5,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningLine: {
    width: FRAME_SIZE * 0.8,
    height: 1,
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
    position: 'absolute',
    top: '40%',
  },
  scanningText: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: spacing.xxl,
    opacity: 0.7,
  },
  quotaBadge: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(201, 168, 76, 0.15)',
  },
  quotaText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.medium,
    letterSpacing: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  seal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
    marginBottom: spacing.md,
  },
  sealText: {
    fontSize: 26,
    fontFamily: fonts.serif.bold,
    color: colors.goldLight,
    lineHeight: 30,
  },
  permissionTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    letterSpacing: 0.5,
  },
  permissionText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  permissionButton: {
    height: 48,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  permissionButtonText: {
    color: '#0A0808',
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
