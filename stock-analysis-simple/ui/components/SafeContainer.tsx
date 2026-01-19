import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

interface SafeContainerProps {
  children: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function SafeContainer({ children, edges = ['top', 'left', 'right'] }: SafeContainerProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
