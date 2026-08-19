import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import { Quiz, QuizResponse } from '../types';

// NOTE for Section A: this component is intentionally decoupled from
// your actual autosave/offline-queue implementation — it exposes
// `onAutosave` and reads `lastSavedAt`/`isOffline` as props so you
// can wire it to whatever local-storage + sync-on-reconnect logic
// you've already built, without this file assuming a specific
// storage layer. Autosave trigger: on answer change (debounced) AND
// on question-navigation pause, per team decision.

type SaveState = 'idle' | 'saving' | 'saved';

interface QuizScreenProps {
  quiz: Quiz;
  response: QuizResponse;
  isOffline: boolean;
  onAnswerChange: (questionId: string, option: string) => void;
  onAutosave: () => Promise<void>; // called on debounce + on question change
  onSubmit: () => Promise<void>;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  return `${mins}m ago`;
}

export default function QuizScreen({
  quiz,
  response,
  isOffline,
  onAnswerChange,
  onAutosave,
  onSubmit,
}: QuizScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = quiz.questions[currentIndex];
  const selectedOption = response.answers[currentQuestion.id];

  const triggerSave = async () => {
    setSaveState('saving');
    await onAutosave();
    setSaveState('saved');
  };

  const handleSelectOption = (option: string) => {
    onAnswerChange(currentQuestion.id, option);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(triggerSave, 800); // autosave on interval after change
  };

  const handleNavigate = (index: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    triggerSave(); // autosave on pause (leaving the question)
    setCurrentIndex(index);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const answeredCount = Object.keys(response.answers).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {quiz.subject} — {quiz.chapter} Quiz
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Due Date</Text>
          <Text style={styles.metaValue}>{new Date(quiz.dueDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Status</Text>
          <Text style={styles.metaValue}>{response.status}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Questions ({quiz.questions.length} total) — Q{currentIndex + 1} of {quiz.questions.length}
        </Text>
        <View style={styles.navRow}>
          {quiz.questions.map((q, i) => {
            const isSaved = !!response.answers[q.id];
            const isCurrent = i === currentIndex;
            return (
              <TouchableOpacity
                key={q.id}
                onPress={() => handleNavigate(i)}
                style={[
                  styles.navPill,
                  isCurrent && styles.navPillCurrent,
                  !isCurrent && isSaved && styles.navPillSaved,
                ]}
              >
                <Text
                  style={[
                    styles.navPillText,
                    (isCurrent || isSaved) && { color: colors.cardWhite },
                  ]}
                >
                  {i + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Saved indicator — stateful, toggles Saving/Saved */}
        <View style={styles.saveIndicatorRow}>
          {saveState === 'saving' && (
            <View style={styles.saveIndicator}>
              <View style={styles.savingDot} />
              <Text style={styles.savingText}>Saving…</Text>
            </View>
          )}
          {saveState === 'saved' && (
            <View style={styles.saveIndicator}>
              <Text style={styles.savedCheck}>✓</Text>
              <Text style={styles.savedText}>Saved · {timeAgo(response.lastSavedAt)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.question}>{currentQuestion.text}</Text>
        {currentQuestion.options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.option, selectedOption === opt && styles.optionSelected]}
            onPress={() => handleSelectOption(opt)}
          >
            <Text
              style={[
                styles.optionText,
                selectedOption === opt && { color: colors.primary, fontWeight: typography.weightSemiBold },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Answers saved</Text>
          <Text style={styles.metaValue}>
            {answeredCount} of {quiz.questions.length}
          </Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
            <Text style={styles.primaryButtonText}>Submit Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={triggerSave}>
            <Text style={styles.secondaryButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>Saved offline — will sync when connected</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base },
  card: {
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.size.header,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  metaLabel: { fontSize: typography.size.small, color: colors.textSecondary },
  metaValue: { fontSize: typography.size.small, color: colors.textPrimary, fontWeight: typography.weightMedium },
  navRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  navPill: {
    width: 32,
    height: 32,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPillCurrent: { backgroundColor: colors.primary, borderColor: colors.primary },
  navPillSaved: { backgroundColor: colors.accent, borderColor: colors.accent },
  navPillText: { fontSize: typography.size.small, color: colors.textPrimary, fontWeight: typography.weightMedium },
  saveIndicatorRow: { marginBottom: spacing.sm },
  saveIndicator: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  savingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textSecondary },
  savingText: { fontSize: typography.size.small, color: colors.textSecondary },
  savedCheck: { color: colors.accent, fontSize: typography.size.small, fontWeight: typography.weightSemiBold },
  savedText: { fontSize: typography.size.small, color: colors.accent },
  question: {
    fontSize: typography.size.body,
    fontWeight: typography.weightMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#EFF6FF' },
  optionText: { fontSize: typography.size.body, color: colors.textPrimary },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: spacing.base,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.cardWhite, fontWeight: typography.weightSemiBold },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.card,
    padding: spacing.base,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: { color: colors.primary, fontWeight: typography.weightSemiBold },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: radius.card,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  offlineBannerText: { color: '#92400E', fontSize: typography.size.small, textAlign: 'center' },
});
