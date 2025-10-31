import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import {
  initializeIAP,
  disconnectIAP,
  getProducts,
  completePurchaseFlow,
  restorePurchases,
  checkSubscriptionStatus,
  PurchaseProduct,
} from '@/lib/services/inAppPurchaseService';
import { PREMIUM_FEATURES } from '@/lib/constants';

export default function UpgradeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();

  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    loadData();
    
    return () => {
      // Cleanup on unmount
      disconnectIAP();
    };
  }, []);

  const loadData = async () => {
    if (!user) {
      router.replace('/');
      return;
    }

    setLoading(true);
    try {
      // Check current subscription status
      const status = await checkSubscriptionStatus(user.id);
      setIsSubscribed(status.isActive);

      // Initialize IAP
      const initResult = await initializeIAP();
      if (!initResult.success) {
        Alert.alert('Erreur', 'Impossible de charger les produits. Veuillez réessayer.');
        return;
      }

      // Get available products
      const availableProducts = await getProducts();
      setProducts(availableProducts);

      // Select monthly by default
      if (availableProducts.length > 0) {
        const monthly = availableProducts.find(p => p.productId.includes('monthly'));
        setSelectedProduct(monthly?.productId || availableProducts[0].productId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user || !selectedProduct) return;

    setPurchasing(true);
    try {
      const result = await completePurchaseFlow(user.id, selectedProduct);

      if (result.success) {
        Alert.alert(
          '🎉 Bienvenue Premium !',
          'Votre abonnement est maintenant actif. Profitez de toutes les fonctionnalités !',
          [
            {
              text: 'Commencer',
              onPress: () => router.push('/'),
            },
          ]
        );
      } else if (result.error !== 'User canceled') {
        Alert.alert('Erreur', result.error || 'Échec de l\'achat. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'achat');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!user) return;

    setPurchasing(true);
    try {
      const result = await restorePurchases();

      if (result.success && result.purchases.length > 0) {
        Alert.alert(
          'Succès',
          'Vos achats ont été restaurés avec succès',
          [{ text: 'OK', onPress: () => loadData() }]
        );
      } else {
        Alert.alert('Info', 'Aucun achat à restaurer');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Erreur', 'Échec de la restauration');
    } finally {
      setPurchasing(false);
    }
  };

  const getProductPrice = (productId: string): string => {
    const product = products.find(p => p.productId === productId);
    return product?.price || '10,00 €';
  };

  const getProductDescription = (productId: string): string => {
    if (productId.includes('yearly')) {
      return 'Facturé annuellement';
    }
    return 'Facturé mensuellement';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement des offres...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSubscribed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Premium</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.subscribedContainer}>
          <View style={[styles.subscribedIcon, { backgroundColor: colors.purple.primary + '20' }]}>
            <MaterialCommunityIcons name="crown" size={64} color={colors.purple.primary} />
          </View>
          <Text style={[styles.subscribedTitle, { color: colors.text }]}>
            Vous êtes Premium !
          </Text>
          <Text style={[styles.subscribedText, { color: colors.textSecondary }]}>
            Vous avez accès à toutes les fonctionnalités premium
          </Text>
          <TouchableOpacity
            style={[styles.backHomeButton, { backgroundColor: colors.purple.primary }]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backHomeButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Passer à Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.crownIcon, { backgroundColor: colors.purple.primary + '20' }]}>
            <MaterialCommunityIcons name="crown" size={48} color={colors.purple.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Débloquez tout le potentiel de Sign-off
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Accédez à toutes les fonctionnalités premium et sécurisez votre héritage numérique
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Fonctionnalités Premium
          </Text>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.purple.primary + '20' }]}>
                <MaterialCommunityIcons name="check" size={20} color={colors.purple.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Choisissez votre plan
          </Text>

          {products.length === 0 ? (
            <View style={styles.noProductsContainer}>
              <Text style={[styles.noProductsText, { color: colors.textSecondary }]}>
                Aucun produit disponible pour le moment
              </Text>
            </View>
          ) : (
            products.map((product) => {
              const isYearly = product.productId.includes('yearly');
              const isSelected = selectedProduct === product.productId;

              return (
                <TouchableOpacity
                  key={product.productId}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: isSelected
                        ? colors.purple.primary + '20'
                        : 'rgba(255, 255, 255, 0.05)',
                      borderColor: isSelected ? colors.purple.primary : 'rgba(255, 255, 255, 0.1)',
                    },
                  ]}
                  onPress={() => setSelectedProduct(product.productId)}
                  activeOpacity={0.7}
                >
                  {isYearly && (
                    <View style={[styles.popularBadge, { backgroundColor: colors.purple.primary }]}>
                      <Text style={styles.popularText}>Économisez 17%</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <View>
                      <Text style={[styles.planName, { color: colors.text }]}>
                        {isYearly ? 'Annuel' : 'Mensuel'}
                      </Text>
                      <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                        {getProductDescription(product.productId)}
                      </Text>
                    </View>
                    <View style={styles.planPriceContainer}>
                      <Text style={[styles.planPrice, { color: colors.text }]}>
                        {product.price}
                      </Text>
                      {isYearly && (
                        <Text style={[styles.planPriceDetail, { color: colors.textSecondary }]}>
                          ~8,33 €/mois
                        </Text>
                      )}
                    </View>
                  </View>

                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color={colors.purple.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Purchase Button */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              {
                backgroundColor: colors.purple.primary,
                opacity: purchasing || !selectedProduct ? 0.5 : 1,
              },
            ]}
            onPress={handlePurchase}
            disabled={purchasing || !selectedProduct}
            activeOpacity={0.8}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="crown" size={24} color="#FFFFFF" />
                <Text style={styles.purchaseButtonText}>
                  Passer à Premium
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Restore Button (iOS only) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={purchasing}
            >
              <Text style={[styles.restoreButtonText, { color: colors.purple.primary }]}>
                Restaurer mes achats
              </Text>
            </TouchableOpacity>
          )}

          {/* Terms */}
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            L'abonnement sera facturé via votre compte {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}.
            Il se renouvelle automatiquement sauf annulation 24h avant la fin de la période.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  crownIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  pricingSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  noProductsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noProductsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  planPriceDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  subscribedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  subscribedIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  subscribedTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subscribedText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  backHomeButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
