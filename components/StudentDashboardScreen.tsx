import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import { Lecture, LectureProgress, Attendance, Quiz, QuizResponse, Student } from '../types';

// NOTE for Section A: data is passed in as props (no fetching here)
// so this screen stays a pure presentational component — wire your
// existing data-fetching/offline-sync hooks at the call site. Tap
// handlers are passed in rather than using a specific navigation
// library, since I don't know which nav setup you've already wired.

interface StudentDashboardScreenProps {
  student: Student;
  upcomingAndLive: Lecture[];
  progressBySubject: { subject: string; chapters: number; completed: number }[];
  attendanceBySubject: { subject: string; present: number; total: number }[];
  quizzes: (Quiz & { responseStatus?: QuizResponse['status'] })[];
  onOpenSubject: (subject: string) => void;
  onOpenLecture: (lectureId: string) => void;
  onOpenQuiz: (quizId: string) => void;
}

function attendancePercent(present: number, total: number) {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

export default function StudentDashboardScreen({
  student,
  upcomingAndLive,
  progressBySubject,
  attendanceBySubject,
  quizzes,
  onOpenSubject,
  onOpenLecture,
  onOpenQuiz,
}: StudentDashboardScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hi, {student.name}</Text>

      {/* Subject tiles — quick glance, tap to open Subject Detail */}
      <Text style={styles.sectionTitle}>Subjects</Text>
      <View style={styles.tileRow}>
        {progressBySubject.map((s) => (
          <TouchableOpacity
            key={s.subject}
            style={styles.subjectTile}
            onPress={() => onOpenSubject(s.subject)}
          >
            <Text style={styles.subjectTileName}>{s.subject}</Text>
            <Text style={styles.subjectTileSub}>
              {s.completed}/{s.chapters} chapters
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upcoming / live lectures */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upcoming / Live Lectures</Text>
        {upcomingAndLive.map((lec) => (
          <TouchableOpacity
            key={lec.id}
            style={styles.row}
            onPress={() => onOpenLecture(lec.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowPrimary}>
                {lec.subject} — {lec.chapter}
              </Text>
              <Text style={styles.rowSecondary}>
                {new Date(lec.scheduledStart).toLocaleString()}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                lec.status === 'live' ? styles.statusLive : styles.statusUpcoming,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  lec.status === 'live' && { color: colors.cardWhite },
                ]}
              >
                {lec.status === 'live' ? 'LIVE' : 'Upcoming'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Attendance summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Attendance Summary</Text>
        {attendanceBySubject.map((a) => {
          const pct = attendancePercent(a.present, a.total);
          return (
            <View key={a.subject} style={styles.row}>
              <Text style={styles.rowPrimary}>{a.subject}</Text>
              <Text
                style={[
                  styles.rowSecondary,
                  { color: pct < 75 ? colors.danger : colors.success, fontWeight: typography.weightSemiBold },
                ]}
              >
                {a.present}/{a.total} ({pct}%)
              </Text>
            </View>
          );
        })}
      </View>

      {/* Quizzes and due dates */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quizzes & Due Dates</Text>
        {quizzes.map((q) => (
          <TouchableOpacity key={q.id} style={styles.row} onPress={() => onOpenQuiz(q.id)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowPrimary}>
                {q.subject} — {q.chapter}
              </Text>
              <Text style={styles.rowSecondary}>Due {new Date(q.dueDate).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.rowSecondary}>{q.responseStatus ?? 'not started'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base },
  greeting: {
    fontSize: typography.size.title,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.size.header,
    fontWeight: typography.weightMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  subjectTile: {
    flex: 1,
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  subjectTileName: {
    fontSize: typography.size.body,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
  },
  subjectTileSub: {
    fontSize: typography.size.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  cardTitle: {
    fontSize: typography.size.header,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowPrimary: {
    fontSize: typography.size.body,
    color: colors.textPrimary,
    fontWeight: typography.weightMedium,
  },
  rowSecondary: {
    fontSize: typography.size.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.card,
  },
  statusLive: { backgroundColor: colors.danger },
  statusUpcoming: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  statusBadgeText: {
    fontSize: typography.size.small,
    fontWeight: typography.weightSemiBold,
    color: colors.textSecondary,
  },
});
