import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessageView, driverChatApi } from '../../services/api';
import { colors, radius, spacing, typography } from '../../constants/theme';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const QUICK = ['Estou a caminho', 'Cheguei ao local', 'Estou a espera', 'Pode sair, por favor?'];
const POLL_MS = 3000;

interface Props {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

export default function TripChat({ visible, onClose, tripId }: Props) {
  const real = UUID.test(tripId);
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [canSend, setCanSend] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<ChatMessageView>>(null);

  const load = useCallback(async () => {
    if (!real) return;
    try {
      const r = await driverChatApi.list(tripId);
      setMessages(r.messages);
      setCanSend(r.canSend);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [real, tripId]);

  useEffect(() => {
    if (!visible || !real) return;
    setLoading(true);
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [visible, real, load]);

  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
  }, [messages.length]);

  const send = async (body: string) => {
    const b = body.trim();
    if (!b || sending || !real) return;
    setSending(true);
    try {
      const m = await driverChatApi.send(tripId, b);
      setMessages((prev) => [...prev, m]);
      setText('');
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const hhmm = (iso: string) => {
    const d = new Date(iso);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Mensagens</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {!real ? (
          <View style={styles.center}>
            <Text style={styles.muted}>O chat nao esta disponivel em corridas de teste.</Text>
          </View>
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {loading ? (
              <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(m) => m.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginTop: spacing.lg }]}>Ainda sem mensagens. Diz ola ao passageiro.</Text>}
                renderItem={({ item }) => (
                  <View style={[styles.bubble, item.fromMe ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, item.fromMe && { color: colors.textInverse }]}>{item.body}</Text>
                    <Text style={[styles.time, item.fromMe && { color: colors.textInverse }]}>{hhmm(item.createdAt)}</Text>
                  </View>
                )}
              />
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {canSend ? (
              <>
                <FlatList
                  horizontal
                  data={QUICK}
                  keyExtractor={(q) => q}
                  showsHorizontalScrollIndicator={false}
                  style={styles.quickRow}
                  contentContainerStyle={{ paddingHorizontal: spacing.md }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.chip} activeOpacity={0.8} onPress={() => send(item)} disabled={sending}>
                      <Text style={styles.chipText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="Escreve uma mensagem"
                    placeholderTextColor={colors.textMuted}
                    maxLength={500}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
                    onPress={() => send(text)}
                    disabled={!text.trim() || sending}
                  >
                    <Ionicons name="send" size={18} color={colors.textInverse} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={[styles.muted, { textAlign: 'center', padding: spacing.md }]}>A conversa esta fechada.</Text>
            )}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h3, color: colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  muted: { ...typography.caption, color: colors.textSecondary },
  list: { padding: spacing.md, flexGrow: 1 },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginBottom: spacing.xs },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleText: { ...typography.body, color: colors.textPrimary },
  time: { ...typography.tiny, color: colors.textMuted, alignSelf: 'flex-end', marginTop: 2 },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  quickRow: { flexGrow: 0, paddingVertical: spacing.xs },
  chip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: spacing.sm, marginRight: spacing.xs },
  chipText: { ...typography.caption, color: colors.textPrimary },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  input: { flex: 1, maxHeight: 110, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, ...typography.body, color: colors.textPrimary },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
});