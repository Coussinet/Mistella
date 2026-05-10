// ============================================================
// YoruConnect - 顧客ノート詳細・編集画面（キャスト専用）
// ============================================================

import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import * as castService from '../../services/castService';
import { useAuthStore } from '../../store/authStore';
import type { CastStackParamList, CustomerNote, User } from '../../types';
import { formatDate } from '../../utils/dateUtils';

type Props = NativeStackScreenProps<CastStackParamList, 'CustomerNote'>;

// -----------------------------------------------------------
// 日付ピッカーフィールド（TextInput で代用）
// -----------------------------------------------------------

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function DateField({ label, value, onChange, placeholder, disabled }: DateFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <MaterialIcons name="event" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder ?? 'YYYY-MM-DD 例: 2024-12-31'}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChange}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          editable={!disabled}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChange('')} style={styles.clearBtn}>
            <MaterialIcons name="close" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {value.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(value) && (
        <Text style={styles.datePreview}>{formatDate(value)}</Text>
      )}
    </View>
  );
}

// -----------------------------------------------------------
// CustomerNoteScreen
// -----------------------------------------------------------

export default function CustomerNoteScreen({ route, navigation }: Props) {
  const { noteId, customerId } = route.params;
  const { user } = useAuthStore();

  const [customer, setCustomer] = useState<User | null>(null);
  const [existingNote, setExistingNote] = useState<CustomerNote | null>(null);
  const [nicknameCalled, setNicknameCalled] = useState('');
  const [noteText, setNoteText] = useState('');
  const [bottleHistory, setBottleHistory] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [birthday, setBirthday] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // -----------------------------------------------------------
  // 顧客情報・既存ノートの取得
  // -----------------------------------------------------------

  useEffect(() => {
    const loadData = async () => {
      if (!customerId) {
        setIsLoading(false);
        return;
      }
      try {
        // 顧客プロフィール取得
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', customerId)
          .single();
        if (!userError && userData) {
          setCustomer(userData as User);
        }

        // 既存ノート取得
        if (noteId) {
          const { data: noteData, error: noteError } = await supabase
            .from('customer_notes')
            .select('*')
            .eq('id', noteId)
            .single();
          if (!noteError && noteData) {
            const note = noteData as CustomerNote;
            setExistingNote(note);
            setNicknameCalled(note.nickname_called ?? '');
            setNoteText(note.note_text ?? '');
            setBottleHistory(note.bottle_history ?? '');
            setNextVisitDate(note.next_visit_date ?? '');
            setBirthday(note.birthday ?? '');
          }
        }
      } catch {
        Alert.alert('エラー', 'データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [customerId, noteId]);

  // -----------------------------------------------------------
  // 保存処理
  // -----------------------------------------------------------

  const handleSave = async () => {
    if (!user || !customerId) {
      Alert.alert('エラー', '顧客情報が必要です。');
      return;
    }

    // 日付形式バリデーション
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (nextVisitDate && !datePattern.test(nextVisitDate)) {
      Alert.alert('入力エラー', '次回来店予定日の形式が正しくありません（YYYY-MM-DD）。');
      return;
    }
    if (birthday && !datePattern.test(birthday)) {
      Alert.alert('入力エラー', '誕生日の形式が正しくありません（YYYY-MM-DD）。');
      return;
    }

    setIsSaving(true);
    try {
      await castService.upsertCustomerNote(user.id, customerId, {
        nickname_called: nicknameCalled.trim() || null,
        note_text: noteText.trim() || null,
        bottle_history: bottleHistory.trim() || null,
        next_visit_date: nextVisitDate || null,
        birthday: birthday || null,
      });
      Alert.alert('保存完了', '顧客メモを保存しました。', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('エラー', '保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------------------------------------
  // チャット画面へ
  // -----------------------------------------------------------

  const handleOpenChat = () => {
    if (!customer) return;
    // マッチIDが必要なため、既存ノートのIDをplaceholderとして使用
    // 実運用ではmatch_idを別途取得する
    if (!existingNote) {
      Alert.alert('チャット', '承諾済みのマッチからチャットを開いてください。');
      return;
    }
    navigation.navigate('ChatRoom', {
      matchId: existingNote.id,
      partnerUser: customer,
    });
  };

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 顧客プロフィール */}
          {customer && (
            <View style={styles.customerProfile}>
              <Avatar
                uri={customer.avatar_url}
                size={64}
                nickname={customer.nickname}
              />
              <View style={styles.customerInfo}>
                <Text style={styles.customerNickname}>{customer.nickname}</Text>
                {customer.bio && (
                  <Text style={styles.customerBio} numberOfLines={2}>
                    {customer.bio}
                  </Text>
                )}
              </View>
              {/* チャットを開くボタン */}
              <TouchableOpacity
                style={styles.chatIconBtn}
                onPress={handleOpenChat}
                activeOpacity={0.8}
              >
                <MaterialIcons name="chat-bubble" size={22} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>メモ編集</Text>

          {/* 呼ばれた名前 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>呼ばれた名前</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="face"
                size={18}
                color={COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="例: みゆきちゃん"
                placeholderTextColor={COLORS.textMuted}
                value={nicknameCalled}
                onChangeText={setNicknameCalled}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          {/* 自由メモ */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>自由メモ</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="好きなお酒、話題、特徴など..."
              placeholderTextColor={COLORS.textMuted}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>

          {/* ボトル履歴 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ボトル履歴</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="local-bar"
                size={18}
                color={COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="例: ヘネシーVSOP ×2本"
                placeholderTextColor={COLORS.textMuted}
                value={bottleHistory}
                onChangeText={setBottleHistory}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          {/* 次回来店予定日 */}
          <DateField
            label="次回来店予定日"
            value={nextVisitDate}
            onChange={setNextVisitDate}
            placeholder="例: 2025-03-15"
            disabled={isSaving}
          />

          {/* 誕生日 */}
          <DateField
            label="誕生日"
            value={birthday}
            onChange={setBirthday}
            placeholder="例: 1995-08-20"
            disabled={isSaving}
          />

          {/* 保存 */}
          <Button
            title="保存する"
            onPress={handleSave}
            loading={isSaving}
            icon="save"
            style={styles.saveBtn}
          />

          {/* チャットを開く */}
          {customer && (
            <Button
              title="チャットを開く"
              onPress={handleOpenChat}
              variant="secondary"
              icon="chat-bubble"
              disabled={isSaving}
              style={styles.chatBtn}
            />
          )}

          <Button
            title="キャンセル"
            onPress={() => navigation.goBack()}
            variant="ghost"
            disabled={isSaving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------
// Styles
// -----------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },

  // 顧客プロフィール
  customerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    gap: 14,
  },
  customerInfo: {
    flex: 1,
    gap: 4,
  },
  customerNickname: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  customerBio: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  chatIconBtn: {
    padding: 8,
  },

  // セクションタイトル
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },

  // 入力グループ
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  textarea: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 120,
    lineHeight: 21,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  datePreview: {
    fontSize: 11,
    color: COLORS.gold,
    marginTop: 4,
    paddingLeft: 2,
  },

  // ボタン
  saveBtn: {
    marginTop: 8,
    marginBottom: 10,
  },
  chatBtn: {
    marginBottom: 10,
  },
});
