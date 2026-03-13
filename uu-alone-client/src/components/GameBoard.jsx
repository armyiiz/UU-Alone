import React, { useState, useEffect } from 'react';
import { parseDeckCSV } from '../utils/deckParser';
import Card from './Card';

export default function GameBoard() {
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [nursery, setNursery] = useState([]);

  const [player, setPlayer] = useState({ hand: [], stable: [], downgrades: [], upgrades: [] });
  const [bot, setBot] = useState({ hand: [], stable: [], downgrades: [], upgrades: [] });

  const [turnState, setTurnState] = useState({
    currentPlayer: 'player', // 'player' | 'bot'
    phase: 'beginning', // 'beginning' | 'draw' | 'action' | 'end'
  });

  const [loading, setLoading] = useState(true);
  const [winner, setWinner] = useState(null);

  // Initialization
  useEffect(() => {
    const initializeGame = async () => {
      try {
        const { deck: parsedDeck, nursery: parsedNursery } = await parseDeckCSV();

        let currentDeck = [...parsedDeck];
        let currentNursery = [...parsedNursery];

        // 1. Assign Baby Unicorns
        const playerBaby = currentNursery.pop();
        const botBaby = currentNursery.pop();

        // 2. Draw Starting Hands (5 cards each)
        const playerHand = [];
        const botHand = [];

        for (let i = 0; i < 5; i++) {
          if (currentDeck.length > 0) playerHand.push(currentDeck.pop());
          if (currentDeck.length > 0) botHand.push(currentDeck.pop());
        }

        setNursery(currentNursery);
        setDeck(currentDeck);

        setPlayer({
          hand: playerHand,
          stable: playerBaby ? [playerBaby] : [],
          downgrades: [],
          upgrades: []
        });

        setBot({
          hand: botHand,
          stable: botBaby ? [botBaby] : [],
          downgrades: [],
          upgrades: []
        });

        setLoading(false);
        setTurnState({ currentPlayer: 'player', phase: 'beginning' });

      } catch (error) {
        console.error("Error initializing game:", error);
      }
    };

    initializeGame();
  }, []);

  // Win Condition Check
  useEffect(() => {
    const checkWinCondition = () => {
      if (player.stable.filter(card => card.type.includes('Unicorn')).length >= 7) {
        setWinner('Player');
      } else if (bot.stable.filter(card => card.type.includes('Unicorn')).length >= 7) {
        setWinner('Bot');
      }
    };
    checkWinCondition();
  }, [player.stable, bot.stable]);


  const drawCard = (targetPlayer) => {
    if (deck.length === 0) return; // Reshuffle logic can be added later

    const newDeck = [...deck];
    const drawnCard = newDeck.pop();
    setDeck(newDeck);

    if (targetPlayer === 'player') {
      setPlayer(prev => ({ ...prev, hand: [...prev.hand, drawnCard] }));
    } else {
      setBot(prev => ({ ...prev, hand: [...prev.hand, drawnCard] }));
    }
  };

  const advancePhase = () => {
    setTurnState(prev => {
      switch (prev.phase) {
        case 'beginning': return { ...prev, phase: 'draw' };
        case 'draw': return { ...prev, phase: 'action' };
        case 'action': return { ...prev, phase: 'end' };
        case 'end':
          // Switch player
          return { currentPlayer: prev.currentPlayer === 'player' ? 'bot' : 'player', phase: 'beginning' };
        default: return prev;
      }
    });
  };

  // --- Player Actions ---
  const handlePlayerDrawPhase = () => {
    if (turnState.currentPlayer !== 'player' || turnState.phase !== 'draw') return;
    drawCard('player');
    advancePhase(); // Auto move to action
  };

  const handlePlayerPlayCard = (cardToPlay) => {
    if (turnState.currentPlayer !== 'player' || turnState.phase !== 'action') return;

    // For Step 1: Only allow playing Unicorns to the stable.
    if (cardToPlay.type.includes('Unicorn')) {
      // Remove from hand
      setPlayer(prev => ({
        ...prev,
        hand: prev.hand.filter(c => c.instanceId !== cardToPlay.instanceId),
        stable: [...prev.stable, cardToPlay]
      }));
      advancePhase(); // Action taken, move to end phase
    } else {
       // Placeholder for non-unicorn logic or discard as action
       alert("In Step 1, you can only play Unicorns as your action.");
    }
  };

  const handlePlayerActionDraw = () => {
    if (turnState.currentPlayer !== 'player' || turnState.phase !== 'action') return;
    drawCard('player');
    advancePhase();
  };

  const handlePlayerDiscard = (cardToDiscard) => {
    if (turnState.currentPlayer !== 'player' || turnState.phase !== 'end') return;

    setPlayer(prev => {
      const newHand = prev.hand.filter(c => c.instanceId !== cardToDiscard.instanceId);
      setDiscardPile([...discardPile, cardToDiscard]);
      return { ...prev, hand: newHand };
    });
  };

  const handlePlayerEndPhaseReady = () => {
    if (turnState.currentPlayer !== 'player' || turnState.phase !== 'end') return;
    if (player.hand.length > 7) {
      alert("You must discard down to 7 cards!");
      return;
    }
    advancePhase(); // Ends turn
  };

  const [selectedCard, setSelectedCard] = useState(null);

  // Bot Turn Effect
  useEffect(() => {
    if (winner || loading) return;

    if (turnState.currentPlayer === 'bot') {
      const timerId = setTimeout(() => {
         handleBotTurn();
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [turnState, winner, loading]);

  // --- Bot Actions (Placeholder for Step 1) ---
  const handleBotTurn = () => {
    // Simple bot logic for Step 1
    if (turnState.phase === 'beginning') {
      advancePhase();
    } else if (turnState.phase === 'draw') {
      drawCard('bot');
      advancePhase();
    } else if (turnState.phase === 'action') {
      // Try to play a unicorn if it has one
      const unicornIndex = bot.hand.findIndex(c => c.type.includes('Unicorn'));
      if (unicornIndex >= 0) {
        const cardToPlay = bot.hand[unicornIndex];
        setBot(prev => {
           const newHand = [...prev.hand];
           newHand.splice(unicornIndex, 1);
           return { ...prev, hand: newHand, stable: [...prev.stable, cardToPlay] };
        });
      } else {
        drawCard('bot'); // Draw if no unicorn
      }
      advancePhase();
    } else if (turnState.phase === 'end') {
      // Discard randomly if over 7
      if (bot.hand.length > 7) {
        setBot(prev => {
          const cardsToDiscardCount = prev.hand.length - 7;
          const newHand = [...prev.hand];
          const newDiscard = [...discardPile];
          for(let i=0; i < cardsToDiscardCount; i++) {
             const discarded = newHand.pop();
             newDiscard.push(discarded);
          }
          setDiscardPile(newDiscard);
          return { ...prev, hand: newHand };
        });
      }
      advancePhase();
    }
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading Deck...</div>;
  if (winner) return <div className="p-8 text-center text-4xl text-green-400 font-bold">{winner} Wins!</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white p-4 overflow-hidden select-none">
       {/* Bot Area */}
       <div className="flex-1 flex flex-col justify-between mb-4 border-b border-slate-700 pb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-red-400">Bot (Stable: {bot.stable.length}/7)</h2>
            <div className="text-sm">Hand: {bot.hand.length} cards</div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
             <div className="flex gap-2 min-h-24 p-2 bg-slate-800 rounded">
                <div className="text-xs text-slate-400">Upgrades</div>
                {bot.upgrades.map(c => <Card key={c.instanceId} card={c} />)}
             </div>
             <div className="flex gap-2 min-h-[120px] p-2 bg-slate-800 rounded items-center">
                <div className="text-xs text-slate-400 mr-2 w-16 text-center">Stable</div>
                <div className="flex gap-2 overflow-x-auto flex-1 pb-2">
                  {bot.stable.map(c => <Card key={c.instanceId} card={c} />)}
                </div>
             </div>
             <div className="flex gap-2 min-h-24 p-2 bg-slate-800 rounded">
                <div className="text-xs text-slate-400">Downgrades</div>
                {bot.downgrades.map(c => <Card key={c.instanceId} card={c} />)}
             </div>
          </div>
       </div>

       {/* Center Area (Deck, Discard, Nursery, Phase Info) */}
       <div className="h-48 flex items-center justify-between px-8 bg-slate-800 rounded mb-4 shadow-inner border border-slate-700">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-36 bg-purple-900 rounded shadow-md border-2 border-purple-500 flex flex-col items-center justify-center text-sm font-bold cursor-pointer hover:bg-purple-800">
                Deck ({deck.length})
              </div>
            </div>
            <div className="flex flex-col items-center">
              {discardPile.length > 0 ? (
                <Card card={discardPile[discardPile.length - 1]} />
              ) : (
                <div className="w-24 h-36 bg-gray-800 rounded border border-gray-600 flex items-center justify-center text-xs text-gray-500">Discard</div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-900 p-4 rounded-lg border-2 border-slate-600 shadow-lg min-w-[300px]">
             <div className="text-2xl font-bold mb-2 uppercase tracking-widest text-blue-400">
               {turnState.currentPlayer === 'player' ? 'Your Turn' : "Bot's Turn"}
             </div>
             <div className="text-lg mb-4 text-slate-300">Phase: {turnState.phase.toUpperCase()}</div>

             {/* Player Controls based on phase */}
             {turnState.currentPlayer === 'player' && (
                <div className="flex gap-2">
                  {turnState.phase === 'beginning' && (
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition" onClick={advancePhase}>Start Turn</button>
                  )}
                  {turnState.phase === 'draw' && (
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition" onClick={handlePlayerDrawPhase}>Draw Card</button>
                  )}
                  {turnState.phase === 'action' && (
                    <>
                      <button
                        className={`px-4 py-2 rounded font-bold transition ${selectedCard ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed text-gray-400'}`}
                        onClick={() => {
                          if (selectedCard) {
                            handlePlayerPlayCard(selectedCard);
                            setSelectedCard(null);
                          }
                        }}
                        disabled={!selectedCard}
                      >
                        Play Selected Card
                      </button>
                      <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold transition" onClick={handlePlayerActionDraw}>Draw (Skip Action)</button>
                    </>
                  )}
                  {turnState.phase === 'end' && (
                    <button
                       className={`px-4 py-2 rounded font-bold transition ${player.hand.length > 7 ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                       onClick={() => {
                          if (player.hand.length > 7) {
                             if(selectedCard) {
                               handlePlayerDiscard(selectedCard);
                               setSelectedCard(null);
                             } else {
                               alert("Select a card to discard down to 7.");
                             }
                          } else {
                             handlePlayerEndPhaseReady();
                          }
                       }}
                    >
                      {player.hand.length > 7 ? 'Discard Selected' : 'End Turn'}
                    </button>
                  )}
                </div>
             )}
          </div>

          <div className="flex flex-col items-center">
            <div className="w-24 h-36 bg-pink-900 rounded shadow-md border-2 border-pink-500 flex flex-col items-center justify-center text-sm font-bold text-pink-200">
              Nursery ({nursery.length})
            </div>
          </div>
       </div>

       {/* Player Area */}
       <div className="flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-blue-400">Player (Stable: {player.stable.length}/7)</h2>
            <div className={`text-sm ${player.hand.length > 7 ? 'text-red-500 font-bold' : ''}`}>Hand: {player.hand.length} cards {player.hand.length > 7 && "(Must Discard)"}</div>
          </div>

          {/* Player Stable */}
          <div className="flex flex-col gap-2 mb-2 flex-1">
             <div className="flex gap-2 min-h-24 p-2 bg-slate-800 rounded">
                <div className="text-xs text-slate-400 w-16 text-center pt-8">Upgrades</div>
                {player.upgrades.map(c => <Card key={c.instanceId} card={c} />)}
             </div>
             <div className="flex gap-2 min-h-[120px] p-2 bg-slate-800 rounded items-center">
                <div className="text-xs text-slate-400 mr-2 w-16 text-center">Stable</div>
                <div className="flex gap-2 overflow-x-auto flex-1 pb-2">
                  {player.stable.map(c => <Card key={c.instanceId} card={c} />)}
                </div>
             </div>
             <div className="flex gap-2 min-h-24 p-2 bg-slate-800 rounded">
                <div className="text-xs text-slate-400 w-16 text-center pt-8">Downgrades</div>
                {player.downgrades.map(c => <Card key={c.instanceId} card={c} />)}
             </div>
          </div>

          {/* Player Hand */}
          <div className="h-48 bg-slate-800 p-2 rounded flex gap-2 overflow-x-auto items-end shadow-inner border-t-4 border-blue-500">
             {player.hand.map(c => (
               <Card
                 key={c.instanceId}
                 card={c}
                 selected={selectedCard?.instanceId === c.instanceId}
                 onClick={() => setSelectedCard(c)}
               />
             ))}
          </div>
       </div>
    </div>
  );
}