import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import { Doubt } from '../types';

// NOTE for Section A: this is the panel built against the CORRECTED
// schema decision — Doubt is now a real entity (see types.ts), no
// longer a placeholder. `onReply` is passed in so you can wire it to
// your actual API call; this component only manages local reply-box
// text state.

interface TeacherDoubtsPanelProps {
  doubts: Doubt[];
  onReply: (doubtId: string, replyText: string) => Promise<void>;
}

function DoubtCard({ doubt, onReply }: { doubt: Doubt; onReply: TeacherDoubtsPanelProps['onReply'] }) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(doubt.id, replyText.trim());
    setSending(false);
  };

  return (
    <View style={styles.doubtCard}>
      <View style={styles.doubtHeader}>
        <Text style={styles.studentName}>{doubt.studentName}</Text>
        <Text style={styles.subjectTag}>{doubt.subject}</Text>
        <View
          style={[
            styles.statusBadge,
            doubt.status === 'open' ? styles.statusOpen : styles.statusResolved,
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {doubt.status === 'open' ? 'Open' : 'Resolved'}
          </Text>
        </View>
      </View>

      <Text style={styles.questionText}>{doubt.questionText}</Text>

      {/* STATE: resolved — show the response, no reply box */}
      {doubt.status === 'resolved' && doubt.replyText && (
        <View style={styles.responseBlock}>
          <Text style={styles.responseLabel}>Your response</Text>
          <Text style={styles.responseText}>{doubt.replyText}</Text>
        </View>
      )}

      {/* STATE: open — text + reply box */}
      {doubt.status === 'open' && (
        <View style={styles.replyBlock}>
          <TextInput
            style={styles.replyInput}
            placeholder="Type a response…"
            multiline
            value={replyText}
            onChangeText={setReplyText}
          />
          <TouchableOpacity
            style={[styles.sendButton, !replyText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!replyText.trim() || sending}
          >
            <Text style={styles.sendButtonText}>{sending ? 'Sending…' : 'Send response'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function TeacherDoubtsPanel({ doubts, onReply }: TeacherDoubtsPanelProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Student Queries / Doubts</Text>
      {doubts.length === 0 && (
        <Text style={styles.emptyText}>No doubts submitted yet.</Text>
      )}
      {doubts.map((d) => (
        <DoubtCard key={d.id} doubt={d} onReply={onReply} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.base,
  },
  cardTitle: {
    fontSize: typography.size.header,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: { fontSize: typography.size.body, color: colors.textSecondary },
  doubtCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
  },
  doubtHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  studentName: { fontSize: typography.size.body, fontWeight: typography.weightSemiBold, color: colors.textPrimary },
  subjectTag: { fontSize: typography.size.small, color: colors.textSecondary },
  statusBadge: { marginLeft: 'auto', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.card },
  statusOpen: { backgroundColor: '#FEF3C7' },
  statusResolved: { backgroundColor: '#DCFCE7' },
  statusBadgeText: { fontSize: typography.size.small, fontWeight: typography.weightMedium, color: colors.textPrimary },
  questionText: { fontSize: typography.size.body, color: colors.textPrimary, marginBottom: spacing.sm },
  responseBlock: { backgroundColor: colors.background, borderRadius: radius.card, padding: spacing.md },
  responseLabel: { fontSize: typography.size.small, color: colors.textSecondary, marginBottom: spacing.xs },
  responseText: { fontSize: typography.size.body, color: colors.textPrimary },
  replyBlock: { gap: spacing.sm },
  replyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: typography.size.body,
    color: colors.textPrimary,
  },
  sendButton: { backgroundColor: colors.primary, borderRadius: radius.card, padding: spacing.md, alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: colors.border },
  sendButtonText: { color: colors.cardWhite, fontWeight: typography.weightSemiBold },
});
