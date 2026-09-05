import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface CameraCaptureProps {
  images: string[];
  onChangeImages: (images: string[]) => void;
  maxImages?: number;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  images,
  onChangeImages,
  maxImages = 5,
}) => {
  const { t } = useTranslation();

  const handleTakePhoto = async () => {
    if (images.length >= maxImages) {
      Alert.alert(t('common.error'), t('product.photoLimitNotice'));
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Camera permission is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        onChangeImages([...images, newUri]);
      }
    } catch (error) {
      console.warn('Camera capture error:', error);
    }
  };

  const handlePickFromGallery = async () => {
    if (images.length >= maxImages) {
      Alert.alert(t('common.error'), t('product.photoLimitNotice'));
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Gallery permission is required to select photos.');
        return;
      }

      const remainingSlots = maxImages - images.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map((asset) => asset.uri);
        onChangeImages([...images, ...newUris].slice(0, maxImages));
      }
    } catch (error) {
      console.warn('Gallery pick error:', error);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    onChangeImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('product.photosSection')}</Text>
        <Text style={styles.countBadge}>
          {t('product.photosCount', { count: images.length })}
        </Text>
      </View>

      {/* Thumbnails Row */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailsContainer}
        >
          {images.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.thumbnailWrapper}>
              <Image source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemovePhoto(index)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              {index === 0 && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>Cover</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Capture Actions */}
      {images.length < maxImages && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cameraBtn]}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('product.takePhoto')}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="camera" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.cameraBtnText}>{t('product.takePhoto')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.galleryBtn]}
            onPress={handlePickFromGallery}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('product.chooseGallery')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="images-outline" size={22} color="#475569" />
            </View>
            <Text style={styles.galleryBtnText}>{t('product.chooseGallery')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  thumbnailsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(124, 45, 18, 0.85)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  coverBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
    minHeight: 56,
  },
  cameraBtn: {
    backgroundColor: '#EA580C',
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  galleryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  galleryBtnText: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 14,
  },
});
