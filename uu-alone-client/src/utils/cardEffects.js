// Card Effects Registry

export const CardEffects = {
  // Angelic Baby Unicorn
  "Angelic Baby Unicorn": {
    onCardDestroyed: (gameState, payload) => {
       // Logic to move it to Nursery instead of Discard
       if (payload.card.name === "Angelic Baby Unicorn") {
         payload.preventDiscard = true; // Tell the game engine NOT to move to discard
         gameState.nursery.push(payload.card);
       }
    },
    onCardSacrificed: (gameState, payload) => {
       if (payload.card.name === "Angelic Baby Unicorn") {
         payload.preventDiscard = true; // Tell the game engine NOT to move to discard
         gameState.nursery.push(payload.card);
       }
    }
  },

  // Catastrophe
  "Catastrophe": {
    onCardPlayed: (gameState, payload) => {
       // Apply global modifier
       if (payload.card.name === "Catastrophe") {
          // It's a Downgrade. In executePlayLogic, it's added to the opponent's downgrades.
          const opponent = payload.sourcePlayer === 'player' ? 'bot' : 'player';
          gameState.modifiers[opponent].unicornsAreCats = true;
       }
    }
  },

  // Dummy Targeted Destroy Magic Card (For Testing the Targeting System)
  "Targeted Destroy (Test)": {
    requiresTarget: true,
    isValidTarget: (targetCard, targetOwner, state) => {
      // Valid target is an opponent's Unicorn
      const { pendingAction } = state;
      if (!pendingAction) return false;
      const opponent = pendingAction.sourcePlayer === 'player' ? 'bot' : 'player';

      // Must target the opponent's card, and it must be a Unicorn in the stable
      return targetOwner === opponent && targetCard.type.includes('Unicorn');
    },
    onCardPlayed: (gameState, payload) => {
      // payload has targetId. We need to find and destroy it.
      if (!payload.targetId) return;
      const opponent = payload.sourcePlayer === 'player' ? 'bot' : 'player';

      const targetCard = gameState[opponent].stable.find(c => c.instanceId === payload.targetId);
      if (targetCard) {
        // Find and remove from location
        gameState[opponent].stable = gameState[opponent].stable.filter(c => c.instanceId !== targetCard.instanceId);
        gameState.discardPile.push(targetCard);
      }
    }
  }
};