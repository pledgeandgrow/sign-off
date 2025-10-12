import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOnboarding } from '@/contexts/OnboardingContext';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Bienvenue sur SignOff',
    description: 'Votre testament numérique sécurisé. Protégez et transmettez vos données importantes à vos proches en toute sécurité.',
    icon: 'shield-lock',
    color: '#8B5CF6',
  },
  {
    id: '2',
    title: 'Coffres-forts chiffrés',
    description: 'Stockez vos mots de passe, documents et informations sensibles dans des coffres-forts protégés par un chiffrement de bout en bout.',
    icon: 'lock-check',
    color: '#A78BFA',
  },
  {
    id: '3',
    title: 'Désignez vos héritiers',
    description: 'Choisissez les personnes de confiance qui pourront accéder à vos données en cas de besoin. Vous gardez le contrôle total.',
    icon: 'account-heart',
    color: '#C4B5FD',
  },
  {
    id: '4',
    title: 'Sécurité maximale',
    description: 'Vos données sont chiffrées avec des clés cryptographiques. Même nous ne pouvons pas y accéder. Seuls vous et vos héritiers le pouvez.',
    icon: 'shield-check',
    color: '#8B5CF6',
  },
  {
    id: '5',
    title: 'Prêt à commencer ?',
    description: 'Créez votre premier coffre-fort, ajoutez vos héritiers et sécurisez votre héritage numérique dès maintenant.',
    icon: 'rocket-launch',
    color: '#A78BFA',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: width * nextIndex,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding();
      router.replace('/(tabs)' as any);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }]}>
          <MaterialCommunityIcons
            name={slide.icon as any}
            size={80}
            color={slide.color}
          />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          {slide.title}
        </Text>
        
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {slide.description}
        </Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {SLIDES.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor:
                index === currentIndex
                  ? colors.purple.primary
                  : colors.textTertiary,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Skip Button */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Passer
          </Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {/* Pagination */}
      {renderPagination()}

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.purple.primary }]}
            onPress={() => {
              const prevIndex = currentIndex - 1;
              setCurrentIndex(prevIndex);
              scrollViewRef.current?.scrollTo({
                x: width * prevIndex,
                animated: true,
              });
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.purple.primary}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.purple.primary },
            currentIndex === 0 && styles.nextButtonFull,
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
          {currentIndex < SLIDES.length - 1 && (
            <MaterialCommunityIcons
              name="arrow-right"
              size={24}
              color="#FFFFFF"
              style={styles.nextButtonIcon}
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  nextButtonIcon: {
    marginLeft: 8,
  },
});
