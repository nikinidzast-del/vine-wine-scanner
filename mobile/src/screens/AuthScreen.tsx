import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import { Button } from '../components/Button';
import { BottleSilhouette } from '../components/BottleSilhouette';
import { ensureUserDoc } from '../services/firestoreService';

type AuthMode = 'choice' | 'emailSignIn' | 'emailSignUp' | 'forgotPassword';

interface Props {
  onAuthSuccess: () => void;
  onBack: () => void;
  onGuestContinue: () => void;
}

export function AuthScreen({ onAuthSuccess, onBack, onGuestContinue }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      });

      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken || (signInResult as any).idToken;

      if (idToken) {
        const { GoogleAuthProvider, signInWithCredential, getAuth, initializeAuth } = await import('firebase/auth');
        const { initializeAuth: initApp } = await import('../services/firebase');
        const app = initApp();
        const auth = initializeAuth(app);
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        await ensureUserDoc(userCredential.user.uid, userCredential.user.email || '');
        onAuthSuccess();
      }
    } catch (error: any) {
      if (error.message !== 'CANCELED' && error.message !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (mode === 'emailSignUp' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const {
        getAuth,
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        initializeAuth,
      } = await import('firebase/auth');
      const { initializeAuth: initApp } = await import('../services/firebase');

      const app = initApp();
      const auth = initializeAuth(app);
      let userCredential;

      if (mode === 'emailSignUp') {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      await ensureUserDoc(userCredential.user.uid, userCredential.user.email || '');
      onAuthSuccess();
    } catch (error: any) {
      const message =
        error.code === 'auth/user-not-found'
          ? 'User not found'
          : error.code === 'auth/wrong-password'
          ? 'Wrong password'
          : error.code === 'auth/email-already-in-use'
          ? 'Email already in use'
          : error.code === 'auth/weak-password'
          ? 'Password too weak (min 6 characters)'
          : error.message;
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { getAuth, sendPasswordResetEmail, initializeAuth } = await import('firebase/auth');
      const { initializeAuth: initApp } = await import('../services/firebase');
      const app = initApp();
      const auth = initializeAuth(app);
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Password reset email sent');
      setMode('emailSignIn');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choice') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.gradientOverlay} />
        <BottleSilhouette opacity={0.05} size={280} style={styles.bgSilhouette} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <View style={styles.content}>
            <View style={styles.sealContainer}>
              <View style={styles.seal}>
                <Text style={styles.sealText}>V</Text>
              </View>
            </View>
            <View style={styles.goldLine} />
            <Text style={styles.authTitle}>{t('onboarding.auth_title')}</Text>
            <Text style={styles.authSubtitle}>{t('onboarding.auth_subtitle')}</Text>

            <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
              disabled={loading}
            >
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>{t('onboarding.google_signin')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode('emailSignIn')} style={styles.emailButton}>
              <Text style={styles.emailLink}>{t('onboarding.email_signin')}</Text>
            </TouchableOpacity>

            <View style={styles.guestDivider}>
              <View style={styles.guestLine} />
              <Text style={styles.guestOr}>OR</Text>
              <View style={styles.guestLine} />
            </View>

            <TouchableOpacity onPress={onGuestContinue} style={styles.guestButton}>
              <Text style={styles.guestText}>{t('onboarding.guest_continue')}</Text>
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>

        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  if (mode === 'forgotPassword') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <BottleSilhouette opacity={0.06} size={180} style={styles.bgSilhouette} />
        <View style={styles.content}>
          <View style={styles.sealContainer}>
            <View style={styles.seal}>
              <Text style={styles.sealText}>V</Text>
            </View>
          </View>
          <Text style={styles.authTitle}>{t('auth.forgot_password')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button
            title={t('auth.send_reset')}
            onPress={handleForgotPassword}
            loading={loading}
          />

          <TouchableOpacity onPress={() => setMode('emailSignIn')}>
            <Text style={styles.link}>{t('auth.back_to_signin')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <BottleSilhouette opacity={0.06} size={180} style={styles.bgSilhouette} />
      <View style={styles.content}>
        <View style={styles.sealContainer}>
          <View style={styles.seal}>
            <Text style={styles.sealText}>V</Text>
          </View>
        </View>
        <Text style={styles.authTitle}>
          {mode === 'emailSignUp' ? t('auth.sign_up') : t('auth.sign_in')}
        </Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {mode === 'emailSignUp' && (
          <TextInput
            style={styles.input}
            placeholder={t('auth.confirm_password')}
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        )}

        <Button
          title={mode === 'emailSignUp' ? t('auth.sign_up') : t('auth.sign_in')}
          onPress={handleEmailAuth}
          loading={loading}
        />

        {mode === 'emailSignIn' && (
          <TouchableOpacity onPress={() => setMode('forgotPassword')}>
            <Text style={styles.link}>{t('auth.forgot_password')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => setMode(mode === 'emailSignIn' ? 'emailSignUp' : 'emailSignIn')}
        >
          <Text style={styles.link}>
            {mode === 'emailSignIn' ? t('auth.no_account') : t('auth.have_account')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0808',
    justifyContent: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(114, 47, 55, 0.04)',
  },
  bgSilhouette: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    zIndex: 2,
    alignItems: 'center',
  },
  sealContainer: {
    marginBottom: spacing.sm,
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
  },
  sealText: {
    fontSize: 26,
    fontFamily: fonts.serif.bold,
    color: colors.goldLight,
    lineHeight: 30,
  },
  goldLine: {
    width: 40,
    height: 0.5,
    backgroundColor: colors.gold,
    opacity: 0.3,
    marginBottom: spacing.sm,
  },
  authTitle: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  authSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.light || fonts.sansSerif.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    opacity: 0.8,
  },
  authButtons: {
    gap: spacing.md,
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  googleButton: {
    width: '100%',
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  googleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 12,
    fontFamily: fonts.sansSerif.bold,
    color: colors.background,
    lineHeight: 14,
  },
  googleButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    color: colors.text,
    letterSpacing: 1,
  },
  emailButton: {
    paddingVertical: spacing.sm,
  },
  emailLink: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    textAlign: 'center',
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  input: {
    height: 52,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  link: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    zIndex: 10,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  guestDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  guestLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  guestOr: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.medium,
    opacity: 0.5,
  },
  guestButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  guestText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    textAlign: 'center',
    letterSpacing: 1,
    opacity: 0.7,
  },
});
