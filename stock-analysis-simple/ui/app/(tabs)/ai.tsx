import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { EddidLogo } from '@/components/EddidLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Plus, Send, Sparkles, Building, TrendingUp, Activity, Droplet, Globe, Repeat, DollarSign, Users } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import {
  handleUserMessage,
  handleGuestMessage,
  createChatSession,
  getChatSession,
  getChatMessages,
  saveUserMessage,
  LOADING_MESSAGES,
  type Message,
} from '@/lib/aiService';
import { getRandomMacroTopics, type MacroTopic } from '@/lib/macroEconomicsContent';

export default function AIScreen() {
  const { colors, colorScheme } = useTheme();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { aiSubscription, checkAILimit } = useSubscription();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showMacroTopics, setShowMacroTopics] = useState(false);
  const [macroTopics, setMacroTopics] = useState<MacroTopic[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [aiLimit, setAILimit] = useState<{
    hasAccess: boolean;
    remaining: number;
    limit: number | null;
    isUnlimited: boolean;
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeChat();
    loadAILimit();
  }, [user]);

  const loadAILimit = async () => {
    const limit = await checkAILimit();
    setAILimit(limit);
  };

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const initializeChat = async () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: t('ai.welcomeMessage'),
      timestamp: new Date().toISOString(),
    };

    if (!user) {
      setIsGuestMode(true);
      setSessionId('guest-session');
      setMessages([welcomeMessage]);
      return;
    }

    setIsGuestMode(false);
    let session = await getChatSession(user.id);

    if (!session) {
      const newSessionId = await createChatSession(user.id);
      setSessionId(newSessionId);
      setMessages([welcomeMessage]);
    } else {
      setSessionId(session.id);
      const chatMessages = await getChatMessages(session.id);
      if (chatMessages.length === 0) {
        setMessages([welcomeMessage]);
      } else {
        setMessages(chatMessages);
      }
    }
  };

  const handleSendMessage = async () => {
    console.log('[UI] handleSendMessage called');
    console.log('[UI] message:', message);
    console.log('[UI] sessionId:', sessionId);
    console.log('[UI] user:', user?.id);
    console.log('[UI] isGuestMode:', isGuestMode);

    if (!message.trim() || !sessionId) {
      console.log('[UI] Validation failed - returning early');
      return;
    }

    const userMessageText = message.trim();
    setMessage('');

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setStreamingContent('');
    setMacroTopics(getRandomMacroTopics(3));
    setShowMacroTopics(true);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    scrollViewRef.current?.scrollToEnd({ animated: true });

    const streamingMessageId = 'streaming-' + Date.now();

    try {
      if (isGuestMode) {
        console.log('[UI] Guest mode - calling AI without database save');
        const assistantMsg = await handleGuestMessage(
          userMessageText,
          language,
          (chunk: string) => {
            setStreamingContent((prev) => prev + chunk);
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        );
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        console.log('[UI] Authenticated mode - checking AI limits');
        const limit = await checkAILimit();
        setAILimit(limit);

        if (!limit.hasAccess && !limit.isUnlimited) {
          const limitMsg: Message = {
            id: 'limit-' + Date.now(),
            role: 'assistant',
            content: t('ai.limitReached'),
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, limitMsg]);
          setIsLoading(false);
          setShowMacroTopics(false);
          return;
        }

        console.log('[UI] Authenticated mode - saving to database');
        await saveUserMessage(sessionId, userMessageText);
        const assistantMsg = await handleUserMessage(
          userMessageText,
          sessionId,
          language,
          (chunk: string) => {
            setStreamingContent((prev) => prev + chunk);
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        );
        setMessages((prev) => [...prev, assistantMsg]);
        await loadAILimit();
      }
    } catch (error) {
      console.error('[UI] Error sending message:', error);
      const errorMsg: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: t('ai.errorMessage'),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      console.log('[UI] Setting loading to false');
      setIsLoading(false);
      setStreamingContent('');
      setShowMacroTopics(false);
      fadeAnim.setValue(0);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handleNewChat = async () => {
    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: t('ai.welcomeMessage'),
      timestamp: new Date().toISOString(),
    };

    if (!user) {
      setSessionId('guest-session-' + Date.now());
      setMessages([welcomeMessage]);
      return;
    }

    const newSessionId = await createChatSession(user.id);
    setSessionId(newSessionId);
    setMessages([welcomeMessage]);
  };

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
  };

  const suggestedQuestions = [
    t('ai.suggestedQuestion1'),
    t('ai.suggestedQuestion2'),
    t('ai.suggestedQuestion3'),
    t('ai.suggestedQuestion4'),
  ];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeContainer edges={['top', 'left', 'right']}>
      <View style={[styles.headerGradient, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <EddidLogo width={120} height={30} color={colorScheme === 'dark' ? '#FFFFFF' : '#0D1647'} />
          <View style={styles.glowEffect} />
        </View>
      </View>

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('ai.title')}</Text>
        <TouchableOpacity
          style={[styles.newChatButton, { backgroundColor: colors.primary }]}
          onPress={handleNewChat}>
          <Plus size={20} color={colors.secondary} />
          <Text style={[styles.newChatButtonText, { color: colors.secondary }]}>{t('ai.newChat')}</Text>
        </TouchableOpacity>
      </View>

      {isGuestMode && (
        <View style={[styles.guestModeBanner, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.guestModeText, { color: colors.textSecondary }]}>
            {t('ai.guestModeNotice')}
          </Text>
        </View>
      )}

      {!isGuestMode && aiLimit && !aiLimit.isUnlimited && (
        <View style={[styles.limitBanner, { backgroundColor: aiLimit.hasAccess ? colors.infoBg : colors.warningBg, borderBottomColor: colors.border }]}>
          <Text style={[styles.limitText, { color: aiLimit.hasAccess ? colors.info : colors.warning }]}>
            {aiLimit.hasAccess
              ? `${aiLimit.remaining} ${t('ai.messagesRemaining')} ${aiLimit.limit} ${t('ai.messagesRemainingThisMonth')}`
              : t('ai.limitReachedUpgrade')}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContentContainer}>
          <View style={styles.messagesSection}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
                  {
                    backgroundColor: msg.role === 'user' ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}>
                {msg.role === 'assistant' && (
                  <View style={styles.assistantBadge}>
                    <Sparkles size={14} color={colors.primary} />
                    <Text style={[styles.assistantBadgeText, { color: colors.primary }]}>{t('ai.aiAssistantBadge')}</Text>
                  </View>
                )}
                <Text style={[styles.messageText, { color: msg.role === 'user' ? colors.secondary : colors.text }]}>
                  {msg.content}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    { color: msg.role === 'user' ? colors.secondary : colors.textTertiary },
                  ]}>
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            ))}

            {showMacroTopics && isLoading && (
              <Animated.View style={{ opacity: fadeAnim }}>
                <View style={[styles.macroTopicsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.macroTopicsHeader}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.macroTopicsTitle, { color: colors.text }]}>
                      While you wait, here are some macro insights...
                    </Text>
                  </View>
                  {macroTopics.map((topic, index) => {
                    const icons = {
                      'building': Building,
                      'trending-up': TrendingUp,
                      'activity': Activity,
                      'droplet': Droplet,
                      'globe': Globe,
                      'repeat': Repeat,
                      'dollar-sign': DollarSign,
                      'users': Users,
                    };
                    const Icon = icons[topic.icon as keyof typeof icons] || Activity;

                    return (
                      <View key={topic.id} style={[styles.macroTopicCard, { borderColor: colors.border }]}>
                        <View style={styles.macroTopicHeader}>
                          <View style={[styles.macroTopicIconContainer, { backgroundColor: colors.infoBg }]}>
                            <Icon size={18} color={colors.info} />
                          </View>
                          <Text style={[styles.macroTopicTitle, { color: colors.text }]}>{topic.title}</Text>
                        </View>
                        <Text style={[styles.macroTopicSummary, { color: colors.textSecondary }]}>
                          {topic.summary}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {isLoading && streamingContent && (
              <View
                style={[
                  styles.messageBubble,
                  styles.assistantMessage,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <View style={styles.assistantBadge}>
                  <Sparkles size={14} color={colors.primary} />
                  <Text style={[styles.assistantBadgeText, { color: colors.primary }]}>{t('ai.aiAssistantBadge')}</Text>
                </View>
                <Text style={[styles.messageText, { color: colors.text }]}>
                  {streamingContent}
                  <Text style={[styles.typingCursor, { color: colors.primary }]}>|</Text>
                </Text>
              </View>
            )}

            {isLoading && !streamingContent && (
              <View
                style={[
                  styles.messageBubble,
                  styles.assistantMessage,
                  styles.loadingBubble,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <View style={styles.assistantBadge}>
                  <Sparkles size={14} color={colors.primary} />
                  <Text style={[styles.assistantBadgeText, { color: colors.primary }]}>{t('ai.aiAssistantBadge')}</Text>
                </View>
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {messages.length <= 1 && (
            <View style={styles.suggestedQuestions}>
              <Text style={[styles.suggestedTitle, { color: colors.textSecondary }]}>{t('ai.suggestedQuestionsTitle')}</Text>
              <View style={styles.suggestedGrid}>
                {suggestedQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestedButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleSuggestedQuestion(question)}>
                    <Text style={[styles.suggestedButtonText, { color: colors.text }]}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View
          style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={message}
              onChangeText={setMessage}
              placeholder={t('ai.askMeAnything')}
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: !message.trim() || isLoading ? colors.border : colors.primary,
                },
              ]}
              disabled={!message.trim() || isLoading}
              onPress={handleSendMessage}>
              <Send size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    right: -20,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F8D000',
    opacity: 0.08,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  guestModeBanner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  guestModeText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  limitBanner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  limitText: {
    ...Typography.caption,
    textAlign: 'center',
    fontWeight: '600',
  },
  title: {
    ...Typography.heading1,
    marginBottom: Spacing.md,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  newChatButtonText: {
    ...Typography.bodyMedium,
  },
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContentContainer: {
    flexGrow: 1,
  },
  messagesSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  assistantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  assistantBadgeText: {
    ...Typography.tiny,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 22,
  },
  messageTime: {
    ...Typography.tiny,
    marginTop: Spacing.xs,
  },
  loadingBubble: {
    minWidth: 200,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.caption,
    fontStyle: 'italic',
  },
  typingCursor: {
    ...Typography.body,
    fontWeight: '700',
  },
  macroTopicsContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  macroTopicsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  macroTopicsTitle: {
    ...Typography.captionMedium,
  },
  macroTopicCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    gap: Spacing.xs,
  },
  macroTopicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  macroTopicIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroTopicTitle: {
    ...Typography.captionMedium,
    flex: 1,
  },
  macroTopicSummary: {
    ...Typography.caption,
    lineHeight: 18,
    marginLeft: 44,
  },
  suggestedQuestions: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  suggestedTitle: {
    ...Typography.captionMedium,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestedButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  suggestedButtonText: {
    ...Typography.caption,
  },
  inputContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    maxHeight: 100,
    paddingTop: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
