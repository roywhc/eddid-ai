import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { SafeContainer } from '@/components/SafeContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, ThumbsUp, MessageCircle, Share2, Bookmark, Sparkles, Send, X, Languages } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { handleNewsArticleQuestion, translateNewsArticle, translateComment, type Message } from '@/lib/aiService';

export default function NewsDetailScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { checkAILimit } = useSubscription();
  const { id } = useLocalSearchParams();
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAIMessage] = useState('');
  const [aiResponse, setAIResponse] = useState<Message | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedArticle, setTranslatedArticle] = useState<{ title: string; content: string } | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatingComments, setTranslatingComments] = useState<Record<string, boolean>>({});
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});
  const [showCommentTranslations, setShowCommentTranslations] = useState<Record<string, boolean>>({});
  const slideAnim = useRef(new Animated.Value(0)).current;

  const mockArticle = {
    id,
    title: 'Fed Signals Rate Cuts Could Begin in Q2 2026',
    source: 'Reuters',
    author: 'John Smith',
    publishedAt: '2 hours ago',
    content: `The Federal Reserve signaled today that interest rate cuts could begin as early as the second quarter of 2026, marking a potential shift in monetary policy after years of high rates.

In a statement following the Fed's policy meeting, officials noted that inflation has been moderating toward their 2% target, while the labor market remains strong. These conditions could justify a more accommodative stance in the coming months.

"We're seeing encouraging signs that inflation is coming down without significant damage to the labor market," Fed Chair Jerome Powell said in a press conference. "If this trend continues, we may have room to adjust our policy stance."

Markets responded positively to the news, with major indices gaining 2-3% on the day. Bond yields fell sharply as investors priced in the possibility of lower rates ahead.

Analysts suggest that the Fed is trying to balance the need to support economic growth while ensuring inflation remains under control. The timing of any rate cuts will depend heavily on incoming economic data over the next several months.

Some economists warn that cutting rates too early could reignite inflation, while others argue that the Fed has already kept rates elevated for too long, risking unnecessary economic weakness.`,
    likes: 234,
    commentsCount: 47,
    tags: ['Federal Reserve', 'Interest Rates', 'Economy', 'Monetary Policy'],
  };

  const mockComments = [
    {
      id: '1',
      user: 'Sarah Chen',
      avatar: 'SC',
      comment: 'This could be a game changer for the market. Tech stocks should benefit significantly from lower rates.',
      likes: 12,
      time: '1h ago',
    },
    {
      id: '2',
      user: 'Mike Johnson',
      avatar: 'MJ',
      comment: 'Too early to celebrate. The Fed has been wrong before about inflation trends.',
      likes: 8,
      time: '45m ago',
    },
    {
      id: '3',
      user: 'Lisa Wong',
      avatar: 'LW',
      comment: 'Finally some good news! My portfolio has been suffering under these high rates.',
      likes: 5,
      time: '30m ago',
    },
  ];

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showAIChat ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showAIChat]);

  const handleSubmitComment = () => {
    if (comment.trim()) {
      setComment('');
    }
  };

  const handleToggleAIChat = () => {
    if (!showAIChat) {
      setAIMessage(comment.trim() || 'What is the key takeaway?');
    }
    setShowAIChat(!showAIChat);
  };

  const handleAskAI = async () => {
    if (!aiMessage.trim()) return;

    if (user) {
      const limit = await checkAILimit();
      if (!limit.hasAccess && !limit.isUnlimited) {
        setAIResponse({
          id: 'limit',
          role: 'assistant',
          content: 'You have reached your AI message limit. Please upgrade your subscription to continue.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    setIsAILoading(true);
    const questionToAsk = aiMessage;
    setAIMessage('');

    try {
      const response = await handleNewsArticleQuestion(
        mockArticle.title,
        mockArticle.content,
        questionToAsk
      );
      setAIResponse(response);
    } catch (error) {
      console.error('Error asking AI:', error);
      setAIResponse({
        id: 'error',
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleTranslate = async () => {
    if (translatedArticle && showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (translatedArticle && !showTranslation) {
      setShowTranslation(true);
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await translateNewsArticle(
        mockArticle.title,
        mockArticle.content,
        language
      );
      setTranslatedArticle(translated);
      setShowTranslation(true);
    } catch (error) {
      console.error('Error translating article:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateComment = async (commentId: string, commentText: string) => {
    if (translatedComments[commentId] && showCommentTranslations[commentId]) {
      setShowCommentTranslations(prev => ({ ...prev, [commentId]: false }));
      return;
    }

    if (translatedComments[commentId] && !showCommentTranslations[commentId]) {
      setShowCommentTranslations(prev => ({ ...prev, [commentId]: true }));
      return;
    }

    setTranslatingComments(prev => ({ ...prev, [commentId]: true }));
    try {
      const translated = await translateComment(commentText, language);
      setTranslatedComments(prev => ({ ...prev, [commentId]: translated }));
      setShowCommentTranslations(prev => ({ ...prev, [commentId]: true }));
    } catch (error) {
      console.error('Error translating comment:', error);
    } finally {
      setTranslatingComments(prev => ({ ...prev, [commentId]: false }));
    }
  };

  return (
    <SafeContainer edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('news.title')}</Text>
        <View style={styles.headerActions}>
          {(language === 'zh-HK' || language === 'zh-CN') && (
            <TouchableOpacity onPress={handleTranslate} style={styles.headerAction} disabled={isTranslating}>
              {isTranslating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Languages size={22} color={showTranslation ? colors.primary : colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setBookmarked(!bookmarked)} style={styles.headerAction}>
            <Bookmark size={22} color={bookmarked ? colors.primary : colors.textSecondary} fill={bookmarked ? colors.primary : 'transparent'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Share2 size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.article}>
            <View style={styles.articleMeta}>
              <Text style={[styles.source, { color: colors.primary }]}>{mockArticle.source}</Text>
              <Text style={[styles.publishedAt, { color: colors.textTertiary }]}>{mockArticle.publishedAt}</Text>
            </View>

            {showTranslation && translatedArticle && (
              <View style={[styles.translationBadge, { backgroundColor: colors.infoBg }]}>
                <Sparkles size={14} color={colors.info} />
                <Text style={[styles.translationBadgeText, { color: colors.info }]}>{t('news.translatedByAI')}</Text>
              </View>
            )}

            <Text style={[styles.title, { color: colors.text }]}>
              {showTranslation && translatedArticle ? translatedArticle.title : mockArticle.title}
            </Text>

            <Text style={[styles.author, { color: colors.textSecondary }]}>By {mockArticle.author}</Text>

            <View style={styles.articleActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setLiked(!liked)}>
                <ThumbsUp
                  size={20}
                  color={liked ? colors.primary : colors.textSecondary}
                  fill={liked ? colors.primary : 'transparent'}
                />
                <Text style={[styles.actionText, { color: liked ? colors.primary : colors.textSecondary }]}>
                  {mockArticle.likes + (liked ? 1 : 0)}
                </Text>
              </TouchableOpacity>
              <View style={styles.actionButton}>
                <MessageCircle size={20} color={colors.textSecondary} />
                <Text style={[styles.actionText, { color: colors.textSecondary }]}>{mockArticle.commentsCount}</Text>
              </View>
            </View>

            <Text style={[styles.articleContent, { color: colors.text }]}>
              {showTranslation && translatedArticle ? translatedArticle.content : mockArticle.content}
            </Text>

            <View style={styles.tags}>
              {mockArticle.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.commentsSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.commentsTitle, { color: colors.text }]}>
              Comments ({mockComments.length})
            </Text>

            {mockComments.map((item) => (
              <View key={item.id} style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.commentHeader}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.secondary }]}>{item.avatar}</Text>
                  </View>
                  <View style={styles.commentMeta}>
                    <Text style={[styles.commentUser, { color: colors.text }]}>{item.user}</Text>
                    <Text style={[styles.commentTime, { color: colors.textTertiary }]}>{item.time}</Text>
                  </View>
                  {(language === 'zh-HK' || language === 'zh-CN') && (
                    <TouchableOpacity
                      onPress={() => handleTranslateComment(item.id, item.comment)}
                      style={styles.commentTranslateButton}
                      disabled={translatingComments[item.id]}>
                      {translatingComments[item.id] ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Languages size={16} color={showCommentTranslations[item.id] ? colors.primary : colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                {showCommentTranslations[item.id] && translatedComments[item.id] && (
                  <View style={[styles.commentTranslationBadge, { backgroundColor: colors.infoBg }]}>
                    <Sparkles size={12} color={colors.info} />
                    <Text style={[styles.commentTranslationBadgeText, { color: colors.info }]}>{t('news.translatedByAI')}</Text>
                  </View>
                )}
                <Text style={[styles.commentText, { color: colors.text }]}>
                  {showCommentTranslations[item.id] && translatedComments[item.id] ? translatedComments[item.id] : item.comment}
                </Text>
                <TouchableOpacity style={styles.commentLike}>
                  <ThumbsUp size={16} color={colors.textSecondary} />
                  <Text style={[styles.commentLikeText, { color: colors.textSecondary }]}>{item.likes}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.commentInput, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your thoughts..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.aiButton, { backgroundColor: colors.secondary }]}
              onPress={handleToggleAIChat}>
              <Sparkles size={18} color={colors.primary} />
              <Text style={[styles.aiButtonText, { color: colors.primary }]}>Ask AI</Text>
            </TouchableOpacity>
            <Button
              title="Post"
              onPress={handleSubmitComment}
              disabled={!comment.trim()}
              size="sm"
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {showAIChat && (
        <Animated.View
          style={[
            styles.aiChatContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              height: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '50%'],
              }),
            },
          ]}>
          <View style={[styles.aiChatHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.aiChatHeaderLeft}>
              <Sparkles size={20} color={colors.primary} />
              <Text style={[styles.aiChatTitle, { color: colors.text }]}>{t('news.aiAnalysis')}</Text>
            </View>
            <TouchableOpacity onPress={handleToggleAIChat} style={styles.closeButton}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.aiChatContent} contentContainerStyle={styles.aiChatContentContainer}>
            {aiResponse && (
              <View style={[styles.aiResponseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.aiResponseHeader}>
                  <Sparkles size={16} color={colors.primary} />
                  <Text style={[styles.aiResponseLabel, { color: colors.primary }]}>AI Assistant</Text>
                </View>
                <Text style={[styles.aiResponseText, { color: colors.text }]}>{aiResponse.content}</Text>
              </View>
            )}

            {isAILoading && (
              <View style={[styles.aiLoadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.aiLoadingText, { color: colors.textSecondary }]}>
                  Analyzing the news article...
                </Text>
              </View>
            )}

            {!aiResponse && !isAILoading && (
              <View style={styles.aiPromptContainer}>
                <Text style={[styles.aiPromptTitle, { color: colors.text }]}>
                  Ask AI about this article
                </Text>
                <Text style={[styles.aiPromptSubtitle, { color: colors.textSecondary }]}>
                  Get instant analysis and insights from our AI assistant
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.aiChatInputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.aiChatInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={aiMessage}
              onChangeText={setAIMessage}
              placeholder="Ask about this news article..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.aiSendButton,
                {
                  backgroundColor: !aiMessage.trim() || isAILoading ? colors.border : colors.primary,
                },
              ]}
              disabled={!aiMessage.trim() || isAILoading}
              onPress={handleAskAI}>
              <Send size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerAction: {
    padding: Spacing.xs,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  article: {
    padding: Spacing.md,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  source: {
    ...Typography.captionMedium,
    textTransform: 'uppercase',
  },
  publishedAt: {
    ...Typography.small,
  },
  title: {
    ...Typography.heading2,
    marginBottom: Spacing.sm,
  },
  author: {
    ...Typography.caption,
    marginBottom: Spacing.lg,
  },
  articleActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionText: {
    ...Typography.caption,
  },
  articleContent: {
    ...Typography.body,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    ...Typography.small,
  },
  commentsSection: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  commentsTitle: {
    ...Typography.heading4,
    marginBottom: Spacing.md,
  },
  commentCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    ...Typography.captionMedium,
  },
  commentMeta: {
    flex: 1,
  },
  commentUser: {
    ...Typography.bodyMedium,
  },
  commentTime: {
    ...Typography.small,
  },
  commentText: {
    ...Typography.body,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  commentLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikeText: {
    ...Typography.small,
  },
  commentInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    ...Typography.body,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxHeight: 100,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  aiButtonText: {
    ...Typography.bodyMedium,
  },
  aiChatContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    overflow: 'hidden',
  },
  aiChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  aiChatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiChatTitle: {
    ...Typography.heading4,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  aiChatContent: {
    flex: 1,
  },
  aiChatContentContainer: {
    padding: Spacing.md,
  },
  aiResponseCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  aiResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  aiResponseLabel: {
    ...Typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiResponseText: {
    ...Typography.body,
    lineHeight: 22,
  },
  aiLoadingCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.md,
  },
  aiLoadingText: {
    ...Typography.body,
  },
  aiPromptContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  aiPromptTitle: {
    ...Typography.heading3,
    marginBottom: Spacing.sm,
  },
  aiPromptSubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  aiChatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  aiChatInput: {
    flex: 1,
    ...Typography.body,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxHeight: 80,
  },
  aiSendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  translationBadgeText: {
    ...Typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commentTranslateButton: {
    padding: Spacing.xs,
    marginLeft: 'auto',
  },
  commentTranslationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  commentTranslationBadgeText: {
    ...Typography.small,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
