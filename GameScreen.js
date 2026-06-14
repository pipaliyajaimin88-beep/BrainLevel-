import React, { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { GameStateContext } from '../context/GameStateContext';
import { useNavigation } from '@react-navigation/native';
import { AudioService } from '../services/AudioService';
import { AdManager } from '../services/AdManager';

const { width } = Dimensions.get('window');

export default function GameScreen() {
  const gameState = useContext(GameStateContext);
  const navigation = useNavigation();

  // Safety check to ensure context is mounted correctly
  if (!gameState) {
    return <View style={styles.container}><Text>Initializing Game Core...</Text></View>;
  }

  const { board, score, isGameOver, triggerUndo, triggerHint } = gameState;

  // Watch for the deterministic game over state and route to the Win screen autonomously
  useEffect(() => {
    if (isGameOver) {
      AudioService.playVictorySoundSequence();
      // Route parameters pass the final score to the subsequent screen
      navigation.navigate('Win', { finalScore: score });
    }
  }, [isGameOver, navigation, score]);

  const onHintPressed = async () => {
    await AudioService.playStandardClick();
    triggerHint();
  };

  const onUndoPressed = async () => {
    await AudioService.playStandardClick();
    triggerUndo();
  };

  const navigateWithAudio = async (routeName) => {
    await AudioService.playStandardClick();
    navigation.navigate(routeName);
  };

  return (
    <View style={styles.masterContainer}>
      <View style={styles.headerDashboard}>
        <Text style={styles.scoreTypography}>Current Score: {score}</Text>
      </View>

      {/* Abstracted Game Board Rendering Layer */}
      <View style={styles.boardMatrixContainer}>
        <Text style={styles.placeholderText}>Game Board Goes Here</Text>
      </View>

      {/* Action Control Buttons - Correctly Bound to Global State */}
      <View style={styles.actionControls}>
        <TouchableOpacity style={styles.primaryButton} onPress={onHintPressed} activeOpacity={0.7}>
          <Text style={styles.buttonTypography}>Utilize Hint</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={onUndoPressed} activeOpacity={0.7}>
          <Text style={styles.buttonTypography}>Undo Move</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Control Buttons - Correctly Bound to the Route Stack */}
      <View style={styles.navigationControls}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigateWithAudio('Leaderboard')}>
          <Text style={styles.buttonTypography}>Rankings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigateWithAudio('Settings')}>
          <Text style={styles.buttonTypography}>System</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigateWithAudio('Shop')}>
          <Text style={styles.buttonTypography}>Store</Text>
        </TouchableOpacity>
      </View>
      
      {/* Third-Party Banner Advertisement Integration */}
      <View style={styles.advertisementContainer}>
        {AdManager.renderBannerAdvertisement()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  masterContainer: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  headerDashboard: { alignItems: 'center', marginBottom: 24, marginTop: 40 },
  scoreTypography: { fontSize: 26, fontWeight: '800', color: '#212529' },
  boardMatrixContainer: { 
    flex: 1, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24
  },
  placeholderText: { color: '#adb5bd', fontStyle: 'italic' },
  actionControls: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  navigationControls: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  primaryButton: { 
    flex: 0.48, 
    paddingVertical: 14, 
    backgroundColor: '#0d6efd', 
    borderRadius: 10,
    alignItems: 'center'
  },
  secondaryButton: { 
    flex: 0.31, 
    paddingVertical: 12, 
    backgroundColor: '#6c757d', 
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonTypography: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  advertisementContainer: { height: 60, width: width - 32, alignItems: 'center', justifyContent: 'center' }
});
