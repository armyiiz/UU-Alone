export const evaluateBotAction = (gameState) => {
  const { bot, player, modifiers } = gameState;

  // Helper: Count unicorns for a player
  const countUnicorns = (playerState, playerType) => {
    if (modifiers[playerType].unicornsAreCats) return 0;
    return playerState.stable.filter((card) => card.type.includes('Unicorn')).length;
  };

  const botUnicorns = countUnicorns(bot, 'bot');
  const playerUnicorns = countUnicorns(player, 'player');

  const botHand = bot.hand;

  // Node 1: Lethal Check
  // Does playing a card result in 7 unicorns? -> DO IT
  if (botUnicorns === 6) {
    const unicornToPlay = botHand.find(c => c.type.includes('Unicorn'));
    if (unicornToPlay) {
      return { action: 'play', card: unicornToPlay };
    }
  }

  // Node 2: Threat Assessment
  // Does the Player have 5-6 unicorns? -> Scan hand for "Destroy/Downgrade" cards. If found -> Target player's best unicorn.
  if (playerUnicorns >= 5) {
     const downgradeCard = botHand.find(c => c.type === 'Downgrade' || c.effectText?.includes('Destroy'));
     if (downgradeCard) {
       // Find the best target (just grab the first player unicorn for now)
       const bestTarget = player.stable.find(c => c.type.includes('Unicorn'));
       if (bestTarget) {
         return { action: 'play', card: downgradeCard, targetId: bestTarget.instanceId };
       }
     }
  }

  // Node 3: Development
  // Play Upgrade on own stable, or play Magical/Basic unicorn.
  const upgradeCard = botHand.find(c => c.type === 'Upgrade');
  if (upgradeCard) {
    return { action: 'play', card: upgradeCard };
  }

  const unicornCard = botHand.find(c => c.type.includes('Unicorn'));
  if (unicornCard) {
    return { action: 'play', card: unicornCard };
  }

  // Node 4: Fallback
  // Draw a card (if hand has room or just pass). Wait, Action phase usually requires playing or drawing.
  // In our game loop, if we don't return 'play', we will draw.
  return { action: 'draw' };
};