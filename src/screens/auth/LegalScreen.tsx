// ============================================================
// Mistella - 法的文書画面（利用規約 / プライバシーポリシー）
// route.params.kind で表示する文書を切り替える。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '@/constants/legal';
import { SPACING, TYPOGRAPHY } from '@/constants/theme';
import type { AuthStackParamList } from '@/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Legal'>;

export default function LegalScreen({ route, navigation }: Props) {
  const { kind } = route.params;
  const title = kind === 'terms' ? '利用規約' : 'プライバシーポリシー';
  const body = kind === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.body}>{body}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
