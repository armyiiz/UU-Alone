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
          // It's a Downgrade. In gameStore.playCard, it's added to the opponent's downgrades.
          // Therefore, the target is the person whose downgrades array it is in.
          // For now, let's just make the target Player if Bot played it, and vice versa.
          const opponent = payload.targetPlayer === 'player' ? 'bot' : 'player';
          gameState.modifiers[opponent].unicornsAreCats = true;
       }
    }
  }
};