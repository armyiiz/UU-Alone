import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CardEffects } from '../utils/cardEffects';
import { parseDeckCSV } from '../utils/deckParser';

export const useGameStore = create(
  immer((set, get) => ({
    // --- State ---
    deck: [],
    discardPile: [],
    nursery: [],
    player: { hand: [], stable: [], downgrades: [], upgrades: [] },
    bot: { hand: [], stable: [], downgrades: [], upgrades: [] },
    turnState: {
      currentPlayer: 'player', // 'player' | 'bot'
      phase: 'beginning', // 'beginning' | 'draw' | 'action' | 'end'
    },
    modifiers: {
      player: { unicornsAreCats: false },
      bot: { unicornsAreCats: false },
    },
    loading: true,
    winner: null,

    // --- Actions ---
    initializeGame: async () => {
      try {
        const { deck: parsedDeck, nursery: parsedNursery } = await parseDeckCSV();

        let currentDeck = [...parsedDeck];
        let currentNursery = [...parsedNursery];

        const playerBaby = currentNursery.pop();
        const botBaby = currentNursery.pop();

        const playerHand = [];
        const botHand = [];

        for (let i = 0; i < 5; i++) {
          if (currentDeck.length > 0) playerHand.push(currentDeck.pop());
          if (currentDeck.length > 0) botHand.push(currentDeck.pop());
        }

        set((state) => {
          state.deck = currentDeck;
          state.nursery = currentNursery;
          state.player.hand = playerHand;
          state.player.stable = playerBaby ? [playerBaby] : [];
          state.bot.hand = botHand;
          state.bot.stable = botBaby ? [botBaby] : [];
          state.loading = false;
          state.turnState = { currentPlayer: 'player', phase: 'beginning' };
          state.winner = null;
        });
      } catch (error) {
        console.error("Error initializing game:", error);
      }
    },

    checkWinCondition: () => {
      const state = get();

      const countUnicorns = (playerType) => {
        const isCat = state.modifiers[playerType].unicornsAreCats;
        if (isCat) return 0; // If they are cats, they don't count towards the unicorn win condition
        return state[playerType].stable.filter((card) => card.type.includes('Unicorn')).length;
      };

      if (countUnicorns('player') >= 7) {
        set((state) => { state.winner = 'Player'; });
      } else if (countUnicorns('bot') >= 7) {
        set((state) => { state.winner = 'Bot'; });
      }
    },

    drawCard: (targetPlayer) => {
      set((state) => {
        if (state.deck.length === 0) return;
        const drawnCard = state.deck.pop();
        state[targetPlayer].hand.push(drawnCard);
      });
    },

    advancePhase: () => {
      set((state) => {
        switch (state.turnState.phase) {
          case 'beginning':
            state.turnState.phase = 'draw';
            break;
          case 'draw':
            state.turnState.phase = 'action';
            break;
          case 'action':
            state.turnState.phase = 'end';
            break;
          case 'end':
            state.turnState.currentPlayer = state.turnState.currentPlayer === 'player' ? 'bot' : 'player';
            state.turnState.phase = 'beginning';
            break;
        }
      });
    },

    // --- Core Engine & Events ---
    triggerEvent: (eventName, payload) => {
       // payload should be { card, targetPlayer, ... }
       const cardName = payload.card?.name;
       if (cardName && CardEffects[cardName] && CardEffects[cardName][eventName]) {
         set((state) => {
           CardEffects[cardName][eventName](state, payload);
         });
       }
    },

    playCard: (targetPlayer, cardToPlay) => {
      set((state) => {
        // Remove from hand
        state[targetPlayer].hand = state[targetPlayer].hand.filter(c => c.instanceId !== cardToPlay.instanceId);

        // Step 1 default logic for Unicorns vs others
        if (cardToPlay.type.includes('Unicorn')) {
          state[targetPlayer].stable.push(cardToPlay);
        } else if (cardToPlay.type === 'Downgrade') {
          // For now, if a player plays a downgrade, it applies to the opponent
          const opponent = targetPlayer === 'player' ? 'bot' : 'player';
          state[opponent].downgrades.push(cardToPlay);
        } else if (cardToPlay.type === 'Upgrade') {
          state[targetPlayer].upgrades.push(cardToPlay);
        } else {
          // Instants/Magic go straight to discard for now (if not handled by effect)
          state.discardPile.push(cardToPlay);
        }
      });

      // Trigger onCardPlayed Event
      get().triggerEvent('onCardPlayed', { card: cardToPlay, targetPlayer });

      // Update Win Condition
      get().checkWinCondition();
    },

    discardCard: (targetPlayer, cardToDiscard) => {
      set((state) => {
        state[targetPlayer].hand = state[targetPlayer].hand.filter(c => c.instanceId !== cardToDiscard.instanceId);
        state.discardPile.push(cardToDiscard);
      });
    },

    destroyCard: (targetPlayer, cardToDestroy, location = 'stable') => {
      // First, trigger onCardDestroyed to see if an effect overrides the default behavior
      // We pass a 'preventDiscard' flag that effects can mutate
      let preventDiscard = false;
      const payload = { card: cardToDestroy, targetPlayer, preventDiscard };

      set((state) => {
        // Find and remove from location
        if (location === 'stable' || location === 'downgrades' || location === 'upgrades') {
           state[targetPlayer][location] = state[targetPlayer][location].filter(c => c.instanceId !== cardToDestroy.instanceId);
        }
      });

      get().triggerEvent('onCardDestroyed', payload);

      if (!payload.preventDiscard) {
        set((state) => {
          state.discardPile.push(cardToDestroy);
        });
      }

      get().checkWinCondition();
    },

    sacrificeCard: (targetPlayer, cardToSacrifice, location = 'stable') => {
      let preventDiscard = false;
      const payload = { card: cardToSacrifice, targetPlayer, preventDiscard };

      set((state) => {
        if (location === 'stable' || location === 'downgrades' || location === 'upgrades') {
           state[targetPlayer][location] = state[targetPlayer][location].filter(c => c.instanceId !== cardToSacrifice.instanceId);
        }
      });

      get().triggerEvent('onCardSacrificed', payload);

      if (!payload.preventDiscard) {
        set((state) => {
          state.discardPile.push(cardToSacrifice);
        });
      }

      get().checkWinCondition();
    }

  }))
);