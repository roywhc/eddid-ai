import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, Camera, User, Mail, Phone, MapPin, Calendar, Edit3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    dateOfBirth: '',
    city: '',
    country: '',
    postalCode: '',
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        fullName: data.full_name || '',
        email: user.email || '',
        phone: data.phone || '',
        address: data.address || '',
        dateOfBirth: data.date_of_birth || '',
        city: data.city || '',
        country: data.country || '',
        postalCode: data.postal_code || '',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      full_name: profile.fullName,
      phone: profile.phone,
      address: profile.address,
      date_of_birth: profile.dateOfBirth,
      city: profile.city,
      country: profile.country,
      postal_code: profile.postalCode,
      updated_at: new Date().toISOString(),
    });

    setIsSaving(false);

    if (!error) {
      setIsEditing(false);
    }
  };

  const getInitials = () => {
    if (!profile.fullName) return user?.email?.substring(0, 2).toUpperCase() || 'JD';
    const names = profile.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return profile.fullName.substring(0, 2).toUpperCase();
  };

  return (
    <SafeContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.title')}</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.headerAction}>
          <Edit3 size={22} color={isEditing ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.secondary }]}>{getInitials()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.avatarEditButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Camera size={16} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.personalInformation')}</Text>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldIcon}>
              <User size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('profile.fullName')}</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={profile.fullName}
                  onChangeText={(text) => setProfile({ ...profile, fullName: text })}
                  placeholder={t('profile.enterFullName')}
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {profile.fullName || t('profile.notProvided')}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldIcon}>
              <Mail size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('profile.email')}</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>{profile.email}</Text>
              <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>{t('profile.emailCannotBeChanged')}</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldIcon}>
              <Phone size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('profile.phoneNumber')}</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={profile.phone}
                  onChangeText={(text) => setProfile({ ...profile, phone: text })}
                  placeholder="+852 1234 5678"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {profile.phone || t('profile.notProvided')}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldIcon}>
              <Calendar size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('profile.dateOfBirth')}</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={profile.dateOfBirth}
                  onChangeText={(text) => setProfile({ ...profile, dateOfBirth: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {profile.dateOfBirth || t('profile.notProvided')}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.address')}</Text>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldIcon}>
              <MapPin size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('profile.streetAddress')}</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={profile.address}
                  onChangeText={(text) => setProfile({ ...profile, address: text })}
                  placeholder="123 Main Street"
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {profile.address || t('profile.notProvided')}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldIcon}>
              <MapPin size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('profile.city')}</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={profile.city}
                  onChangeText={(text) => setProfile({ ...profile, city: text })}
                  placeholder="Hong Kong"
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>{profile.city || t('profile.notProvided')}</Text>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldIcon}>
              <MapPin size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('profile.country')}</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={profile.country}
                  onChangeText={(text) => setProfile({ ...profile, country: text })}
                  placeholder="Hong Kong"
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {profile.country || t('profile.notProvided')}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldIcon}>
              <MapPin size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('profile.postalCode')}</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={profile.postalCode}
                  onChangeText={(text) => setProfile({ ...profile, postalCode: text })}
                  placeholder="000000"
                  placeholderTextColor={colors.textTertiary}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {profile.postalCode || t('profile.notProvided')}
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {isEditing && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            title={t('common.cancel')}
            onPress={() => {
              setIsEditing(false);
              loadProfile();
            }}
            variant="outline"
            style={styles.footerButton}
          />
          <Button
            title={isSaving ? t('profile.saving') : t('profile.saveChanges')}
            onPress={handleSave}
            disabled={isSaving}
            style={styles.footerButton}
          />
        </View>
      )}
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading4,
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: '50%',
    marginRight: -60,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  fieldIcon: {
    width: 40,
    paddingTop: 4,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    ...Typography.caption,
    marginBottom: 4,
  },
  fieldValue: {
    ...Typography.body,
  },
  fieldInput: {
    ...Typography.body,
    paddingVertical: 4,
  },
  fieldHint: {
    ...Typography.small,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
