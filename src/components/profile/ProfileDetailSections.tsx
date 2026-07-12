// ============================================================
// Mistella - ProfileDetailSections
// プロフィール画面の詳細情報セクション群。
// 自己紹介・料金システム・キャスト詳細（プロフィール/アピール）を
// Card 風セクションに整理して表示する。
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '@/components/common/Card';
import { COLORS } from '@/constants/colors';
import { SPACING, TYPOGRAPHY } from '@/constants/theme';
import type { CastProfile, User } from '@/types';

// -----------------------------------------------------------
// 詳細行
// -----------------------------------------------------------

type DetailItem = { label: string; value: string | null };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// -----------------------------------------------------------
// Card 風セクション
// -----------------------------------------------------------

interface DetailCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  items: DetailItem[];
}

function DetailCard({ icon, title, items }: DetailCardProps) {
  const visibleItems = items.filter(
    (item): item is { label: string; value: string } => !!item.value?.trim(),
  );
  if (visibleItems.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={icon} size={16} color={COLORS.gold} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {visibleItems.map((item) => (
        <DetailRow key={item.label} label={item.label} value={item.value} />
      ))}
    </Card>
  );
}

// -----------------------------------------------------------
// セクション群本体
// -----------------------------------------------------------

interface ProfileDetailSectionsProps {
  user: User;
  castProfile: CastProfile | null;
}

export default function ProfileDetailSections({
  user,
  castProfile,
}: ProfileDetailSectionsProps) {
  const isCastTarget = user.role === 'cast';

  return (
    <View style={styles.container}>
      {/* 自己紹介 */}
      {user.bio ? (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="format-quote" size={16} color={COLORS.gold} />
            <Text style={styles.cardTitle}>自己紹介</Text>
          </View>
          <Text style={styles.bio}>{user.bio}</Text>
        </Card>
      ) : null}

      {/* 料金情報（キャストのみ） */}
      {isCastTarget && castProfile?.price_info ? (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="attach-money" size={16} color={COLORS.gold} />
            <Text style={styles.cardTitle}>料金システム</Text>
          </View>
          <Text style={styles.bodyText}>{castProfile.price_info}</Text>
        </Card>
      ) : null}

      {/* キャスト詳細項目 */}
      {isCastTarget && castProfile ? (
        <>
          <DetailCard
            icon="person-outline"
            title="プロフィール"
            items={[
              { label: '年齢', value: castProfile.age != null ? `${castProfile.age}歳` : null },
              { label: '身長', value: castProfile.height != null ? `${castProfile.height}cm` : null },
              { label: '血液型', value: castProfile.blood_type },
              { label: '出身地', value: castProfile.hometown },
              { label: '趣味・特技', value: castProfile.hobbies },
              { label: '性格', value: castProfile.personality },
              { label: 'チャームポイント', value: castProfile.charm_point },
            ]}
          />
          <DetailCard
            icon="local-bar"
            title="お客様へのアピール"
            items={[
              { label: '得意なお酒・飲み方', value: castProfile.favorite_drink },
              { label: '接客スタイル', value: castProfile.service_style },
              { label: '得意な話題', value: castProfile.favorite_topics },
              { label: '一緒にやりたいこと', value: castProfile.activities },
              { label: '座右の銘・好きな言葉', value: castProfile.motto },
              { label: 'お客様への一言', value: castProfile.customer_message },
            ]}
          />
        </>
      ) : null}
    </View>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  card: {
    gap: SPACING.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    marginBottom: SPACING.xxs,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  bio: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  bodyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    width: 108,
    paddingTop: 3,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
});
